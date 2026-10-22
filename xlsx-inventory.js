// Read-only XLSX structure inventory. No upload, formula evaluation or persistence.
const MAX_FILE=10*1024*1024, MAX_EXPANDED=32*1024*1024, MAX_ENTRY=12*1024*1024;
const decoder=new TextDecoder('utf-8',{fatal:true});
const supported=new Set('ABS AND AVERAGE AVERAGEIF AVERAGEIFS CEILING CONCAT CONCATENATE COUNT COUNTA COUNTBLANK COUNTIF COUNTIFS DATE DAY EDATE EOMONTH FLOOR HLOOKUP IF IFERROR IFNA INDEX INT ISBLANK ISNUMBER LEFT LEN LOWER MATCH MAX MID MIN MOD MONTH NOT OR PRODUCT RIGHT ROUND ROUNDDOWN ROUNDUP ROW ROWS SUM SUMIF SUMIFS SUMPRODUCT TEXT TODAY TRIM UPPER VLOOKUP WEEKDAY YEAR'.split(' '));
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
export async function readZip(buffer){
 if(buffer.byteLength>MAX_FILE)throw Error('File is larger than the 10 MB limit.');
 const bytes=new Uint8Array(buffer),v=new DataView(buffer);if(bytes.length<22)throw Error('This is not a readable .xlsx ZIP archive.');
 let end=-1;for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--)if(v.getUint32(p,true)===0x06054b50&&p+22+v.getUint16(p+20,true)===bytes.length){end=p;break;}
 if(end<0)throw Error('The file is incomplete, protected or not a supported .xlsx archive.');
 const count=v.getUint16(end+10,true),start=v.getUint32(end+16,true),size=v.getUint32(end+12,true);
 if(v.getUint16(end+4,true)||v.getUint16(end+6,true)||v.getUint16(end+8,true)!==count||count===65535||count>400||start+size>end)throw Error('Multi-part, ZIP64 or oversized archives are not supported.');
 const entries=new Map();let p=start,total=0,extracted=0;
 for(let i=0;i<count;i++){
  if(p+46>end||v.getUint32(p,true)!==0x02014b50)throw Error('Invalid archive directory.');
  const flags=v.getUint16(p+8,true),method=v.getUint16(p+10,true),crc=v.getUint32(p+16,true),compressed=v.getUint32(p+20,true),length=v.getUint32(p+24,true),nl=v.getUint16(p+28,true),el=v.getUint16(p+30,true),cl=v.getUint16(p+32,true),offset=v.getUint32(p+42,true);
  if(p+46+nl+el+cl>end||flags&1||![0,8].includes(method)||length>MAX_ENTRY||offset===0xffffffff||compressed===0xffffffff||length===0xffffffff)throw Error('Encrypted or unsupported archive entry.');
  const name=decoder.decode(bytes.subarray(p+46,p+46+nl));
  if(name.includes('\\')||name.startsWith('/')||name.split('/').includes('..')||entries.has(name))throw Error('Unsupported or duplicated archive path.');
  total+=length;if(total>MAX_EXPANDED||length>Math.max(compressed*300,1024*1024))throw Error('Expanded workbook exceeds safe processing limits.');
  entries.set(name,{name,flags,method,crc,compressed,length,offset});p+=46+nl+el+cl;
 }
 if(p!==start+size)throw Error('Inconsistent archive directory.');
 async function text(name,required=true){
  const e=entries.get(name);if(!e){if(!required)return null;throw Error('Missing required workbook component: '+name);}
  const o=e.offset;if(o+30>start||v.getUint32(o,true)!==0x04034b50)throw Error('Invalid workbook entry.');
  const nl=v.getUint16(o+26,true),el=v.getUint16(o+28,true),from=o+30+nl+el;
  if(v.getUint16(o+6,true)&1||v.getUint16(o+8,true)!==e.method||from+e.compressed>start||decoder.decode(bytes.subarray(o+30,o+30+nl))!==name)throw Error('Inconsistent workbook entry.');
  let data=bytes.slice(from,from+e.compressed);
  if(e.method===8){
   if(typeof DecompressionStream==='undefined')throw Error('Your browser does not support local ZIP decompression. Use an up-to-date Chrome, Edge, Firefox or Safari.');
   const reader=new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader(),chunks=[];let n=0;
   try{while(true){const r=await reader.read();if(r.done)break;n+=r.value.length;if(n>e.length||n>MAX_ENTRY){await reader.cancel();throw Error('Expanded entry exceeds its declared limit.');}chunks.push(r.value);}}finally{reader.releaseLock();}
   data=new Uint8Array(n);let at=0;for(const chunk of chunks){data.set(chunk,at);at+=chunk.length;}
  }
  extracted+=data.length;if(extracted>MAX_EXPANDED||data.length!==e.length||crc32(data)!==e.crc)throw Error('Corrupt workbook data or processing limit exceeded.');
  return decoder.decode(data);
 }
 return {entries,text};
}
function xml(text){if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('XML declarations with external entities are unsupported.');const d=new DOMParser().parseFromString(text,'application/xml');if(d.querySelector('parsererror'))throw Error('Malformed workbook XML.');return d;}
const all=(node,tag)=>Array.from(node.getElementsByTagNameNS('*',tag));
function relative(base,target){if(/^[a-z]+:/i.test(target)||target.includes('\\'))throw Error('Unsupported workbook relationship.');const parts=(target.startsWith('/')?'':base.substring(0,base.lastIndexOf('/')+1))+target.replace(/^\//,'');const result=[];for(const s of parts.split('/')){if(s==='..'){if(!result.length)throw Error('Workbook relationship escapes archive.');result.pop();}else if(s&&s!=='.')result.push(s);}return result.join('/');}
const stripStrings=formula=>formula.replace(/"(?:[^"]|"")*"/g,'');
const threeD=/(?:'(?:[^']|'')*:(?:[^']|'')*'|[A-Za-z_][A-Za-z0-9_.]*:[A-Za-z_][A-Za-z0-9_.]*)!\$?[A-Za-z]{1,3}\$?[1-9][0-9]*(?::\$?[A-Za-z]{1,3}\$?[1-9][0-9]*)?/g;
export function referenceCoverageIssues(formula){
 const clean=stripStrings(formula),issues=[];
 if(new RegExp(threeD.source).test(clean))issues.push('Three-dimensional sheet references are not expanded.');
 if(/(?:^|[^A-Za-z0-9_])\$?[A-Za-z]{1,3}:\$?[A-Za-z]{1,3}(?![A-Za-z0-9_])/.test(clean))issues.push('Whole-column references are not expanded.');
 if(/(?:^|[^A-Za-z0-9_])\$?[1-9][0-9]*:\$?[1-9][0-9]*(?![A-Za-z0-9_])/.test(clean))issues.push('Whole-row references are not expanded.');
 return issues;
}
export function directReferences(formula){
 // Strip strings, then extract direct A1 references. This does not resolve names or INDIRECT.
 const clean=stripStrings(formula).replace(threeD,' ');
 const re=/(?:'(?:[^']|'')+'!|(?:[A-Za-z_][A-Za-z0-9_. ]*)!)?\$?[A-Za-z]{1,3}\$?[1-9][0-9]*(?::\$?[A-Za-z]{1,3}\$?[1-9][0-9]*)?/g;
 return [...new Set([...clean.matchAll(re)].filter(m=>{const before=clean[m.index-1]??'',after=clean[m.index+m[0].length]??'';return !/[A-Za-z0-9_.]/.test(before)&&!/[A-Za-z0-9_(]/.test(after);}).map(m=>m[0]))];
}
export async function inspectWorkbook(buffer,name='workbook.xlsx'){
 if(!/\.xlsx$/i.test(name))throw Error('Choose an ordinary .xlsx file. .xls, .xlsm and protected files are outside this tool’s scope.');
 const zip=await readZip(buffer),paths=[...zip.entries.keys()];
 const types=await zip.text('[Content_Types].xml'),root=xml(await zip.text('_rels/.rels'));
 const office=all(root,'Relationship').find(r=>/\/officeDocument$/.test(r.getAttribute('Type')));
 if(!office||office.getAttribute('TargetMode')==='External')throw Error('This archive is not a supported Excel workbook.');
 const workbookPath=relative('',office.getAttribute('Target')),book=xml(await zip.text(workbookPath));
 const dir=workbookPath.substring(0,workbookPath.lastIndexOf('/')+1),file=workbookPath.split('/').pop();
 const rels=xml(await zip.text(dir+'_rels/'+file+'.rels')),map=new Map(all(rels,'Relationship').map(r=>[r.getAttribute('Id'),r]));
 const flags=new Set(),sheets=[],formulas=[],names=all(book,'definedName').map(n=>({name:n.getAttribute('name'),reference:n.textContent}));
 if(/macroEnabled|vbaProject/i.test(types)||paths.some(p=>/vbaProject|macrosheets|activeX|embeddings\//i.test(p)))flags.add('Active, embedded or macro content is present. It is not executed and is outside the standard service scope.');
 if(paths.some(p=>/externalLinks\/|connections\.xml$|queryTables\//i.test(p))||all(rels,'Relationship').some(r=>r.getAttribute('TargetMode')==='External'))flags.add('External links or data connections are present. Their data and behavior are not inspected.');
 if(all(book,'workbookProtection').length)flags.add('Workbook protection is present. Review access and scope separately.');
 const sheetNodes=all(book,'sheet');
 if(!sheetNodes.length)throw Error('No worksheets were found. A complete workbook inventory cannot be produced.');
 if(sheetNodes.length>30)throw Error('More than 30 sheets exceeds the free tool’s processing limit. No complete inventory was produced.');
 if(sheetNodes.length>10)flags.add('More than 10 sheets: outside the standard service scope.');
 let totalCells=0;
 for(const node of sheetNodes){
  const id=node.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')||node.getAttribute('r:id'),rel=map.get(id);
  if(!rel||rel.getAttribute('TargetMode')==='External'||!rel.getAttribute('Type').endsWith('/worksheet')){flags.add('A non-worksheet sheet was not inspected. Inventory is incomplete.');sheets.push({name:node.getAttribute('name'),state:node.getAttribute('state')||'visible',cells:0,formulas:0,inspected:false});continue;}
  const path=relative(workbookPath,rel.getAttribute('Target')),d=xml(await zip.text(path)),sheet={name:node.getAttribute('name'),state:node.getAttribute('state')||'visible',cells:0,formulas:0,inspected:true};
  const sheetRelsPath=path.substring(0,path.lastIndexOf('/')+1)+'_rels/'+path.split('/').pop()+'.rels';
  const sheetRelText=await zip.text(sheetRelsPath,false);
  if(sheetRelText&&all(xml(sheetRelText),'Relationship').some(r=>r.getAttribute('TargetMode')==='External'))flags.add('A sheet contains an external relationship or hyperlink. This tool does not follow it.');
  if(all(d,'sheetProtection').length)flags.add('Sheet protection is present. Review access and scope separately.');
  if(all(d,'tablePart').length)flags.add('Excel tables are present. Table semantics are not expanded by this inventory.');
  for(const c of all(d,'c')){
   if(!c.hasChildNodes())continue;sheet.cells++;if(++totalCells>100000)throw Error('More than 100,000 populated cells exceeds the free tool’s safety limit. No complete inventory was produced.');
   const f=all(c,'f')[0];if(!f)continue;sheet.formulas++;if(formulas.length>=10000)throw Error('More than 10,000 formula cells exceeds this tool’s safety limit. No complete inventory was produced.');
   const formula=f.textContent,ref=c.getAttribute('r');
   if(!ref||formula.length>16000)throw Error('Unsupported or oversized formula record.');
   const noStrings=formula.replace(/"(?:[^"]|"")*"/g,'');
   for(const issue of referenceCoverageIssues(formula))flags.add(issue+' Separate scope review is required.');
   const functions=[...noStrings.matchAll(/\b([A-Za-z_][A-Za-z0-9_.]*)\s*\(/g)].map(m=>m[1].toUpperCase());
   const unsupported=[...new Set(functions.filter(x=>!supported.has(x)))];
   if(unsupported.length)flags.add('Formula functions need separate review: '+unsupported.join(', ')+'.');
   if(f.getAttribute('t')||!formula)flags.add('Shared, array or special formulas are present. Their full behavior is not expanded.');
   if(/[\[\]]/.test(noStrings))flags.add('External or structured formula references are present and need separate review.');
   if(functions.some(x=>['INDIRECT','OFFSET'].includes(x)))flags.add('Dynamic formula references cannot be resolved by this inventory.');
   formulas.push({sheet:sheet.name,cell:ref,formula:formula?'='+formula:'[shared formula follower - not expanded]',references:directReferences(formula),cachedValue:all(c,'v')[0]?.textContent??null,formulaType:f.getAttribute('t')||'ordinary'});
  }
  sheets.push(sheet);
 }
 if(formulas.length>2000)flags.add('More than 2,000 formula cells: outside the standard service scope.');
 if(names.length)flags.add('Defined names are listed in the download; their semantics and dependency expansion need review.');
 return {format:'rowan-workbook-inventory-v1',file:name,generatedAt:new Date().toISOString(),complete:sheets.every(s=>s.inspected),sheets,formulas,definedNames:names,flags:[...flags],standardScopeCandidate:flags.size===0,limitations:['No formula recalculation or correctness verification.','No business-policy interpretation.','Direct A1 references only; names, dynamic references, tables, whole rows/columns and 3D sheet references are not expanded.','Cached values are file contents, not current verified calculations.','This report is not the paid migration blueprint.']};
}

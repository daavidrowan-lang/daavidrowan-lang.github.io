const form=document.querySelector('#enquiry-form');
if(form){
 const service=document.querySelector('#service'),project=document.querySelector('#project'),status=document.querySelector('#enquiry-status');
 for(const a of document.querySelectorAll('[data-service]'))a.addEventListener('click',()=>{service.value=a.dataset.service;});
 const campaign=new URLSearchParams(window.location.search).get('utm_campaign');
 const references={'rowan-oct26-2026':'October 2026 workbook campaign'};
 const reference=Object.hasOwn(references,campaign)?references[campaign]:'';
 const referenceNotice=document.querySelector('#campaign-reference');
 if(reference){referenceNotice.hidden=false;referenceNotice.textContent='Your draft will include this reference: '+reference+'.';}
 const organization=document.querySelector('#organization'),timing=document.querySelector('#timing');
 const text=()=>`Service: ${service.value}
Organization: ${organization.value.trim()||'[not supplied]'}
Project stage: ${timing.value}${reference?'\nReference: '+reference:''}\n\nDecision / project outline:\n${project.value.trim()}\n\nPlease confirm fit, availability and the next steps before any files or payment.`;
 form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;window.location.href=`mailto:daavidrowan@gmail.com?subject=${encodeURIComponent('Rowan Workshop enquiry: '+service.value)}&body=${encodeURIComponent(text())}`;status.textContent='Your email app should open with a draft. Review and send it there. If it does not open, use Copy enquiry and email daavidrowan@gmail.com.';});
 document.querySelector('#copy-enquiry').addEventListener('click',async()=>{if(!form.reportValidity())return;try{await navigator.clipboard.writeText(text());status.textContent='Enquiry copied. Paste it into an email to daavidrowan@gmail.com. Nothing has been submitted here.';}catch{status.textContent='Your browser could not copy automatically. Select and copy your outline, then email daavidrowan@gmail.com.';project.focus();project.select();}});
}

const form=document.querySelector('#enquiry-form');
if(form){
 const service=document.querySelector('#service'),project=document.querySelector('#project'),status=document.querySelector('#enquiry-status');
 for(const a of document.querySelectorAll('[data-service]'))a.addEventListener('click',()=>{service.value=a.dataset.service;});
 const text=()=>`Service: ${service.value}\n\nProject outline:\n${project.value.trim()}\n\nPlease confirm fit, availability and the next steps before any files or payment.`;
 form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;window.location.href=`mailto:daavidrowan@gmail.com?subject=${encodeURIComponent('Rowan Workshop enquiry: '+service.value)}&body=${encodeURIComponent(text())}`;status.textContent='Your email app should open with a draft. Review and send it there. If it does not open, use Copy enquiry and email daavidrowan@gmail.com.';});
 document.querySelector('#copy-enquiry').addEventListener('click',async()=>{if(!form.reportValidity())return;try{await navigator.clipboard.writeText(text());status.textContent='Enquiry copied. Paste it into an email to daavidrowan@gmail.com. Nothing has been submitted here.';}catch{status.textContent='Your browser could not copy automatically. Select and copy your outline, then email daavidrowan@gmail.com.';project.focus();project.select();}});
}

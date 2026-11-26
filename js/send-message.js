(function(){
'use strict';
const $=id=>document.getElementById(id),form=$('inbox-form'),status=$('inbox-status'),button=$('send-button');
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function note(text,error){status.hidden=false;status.className='inbox-status'+(error?' error':'');status.textContent=text;}
async function init(){
 if(!window.sb||!window.sbPublic){note(window.CE?.setupProblem?.()||'Hapn is temporarily unavailable. Please try again.',true);button.disabled=true;return;}
 let colleges,error;({data:colleges,error}=await sbPublic.from('colleges').select('id,name').eq('is_active',true).order('name'));
 if(error||!colleges?.length){$('college').innerHTML='<option value="">College list unavailable</option>';note('We could not load the college list. Please refresh and try again.',true);button.disabled=true;return;}
 $('college').innerHTML='<option value="">Choose your college</option>'+colleges.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('');
 try{const saved=localStorage.getItem('hapn_selected_college_id');if(saved&&colleges.some(c=>c.id===saved))$('college').value=saved;}catch(_){}
 const {data:{user}}=await sb.auth.getUser().catch(()=>({data:{user:null}}));
 if(user){
   const {data:m}=await sb.from('campus_members').select('full_name,email,college_id').eq('user_id',user.id).maybeSingle();
   const full=(m?.full_name||user.user_metadata?.full_name||user.user_metadata?.name||'').trim().split(/\s+/);
   if(full[0])$('first-name').value=full.shift();
   if(full.length)$('last-name').value=full.join(' ');
   $('email').value=m?.email||user.email||'';
   if(m?.college_id)$('college').value=m.college_id;
   const {data:p}=await sb.from('campus_member_private').select('whatsapp_phone').eq('user_id',user.id).maybeSingle();
   if(p?.whatsapp_phone)$('phone').value=p.whatsapp_phone;
 }
 form.addEventListener('submit',async e=>{
  e.preventDefault();button.disabled=true;button.textContent='Sending…';status.hidden=true;
  try{
   const {data,error}=await sb.rpc('submit_hapn_inbox',{p_college_id:$('college').value,p_first_name:$('first-name').value.trim(),p_last_name:$('last-name').value.trim(),p_email:$('email').value.trim(),p_phone:$('phone').value.trim()||null,p_message:$('message').value.trim(),p_source_type:'message',p_source_id:null,p_source_label:null});
   if(error)throw error;
   form.reset();$('college').value='';note('Your message has been sent. Thank you for contacting Hapn.');window.scrollTo({top:0,behavior:'smooth'});
  }catch(err){note(err.message||'Could not send your message. Please try again.',true);}
  finally{button.disabled=false;button.textContent='Send Message';}
 });
}
init().catch(()=>note('Could not load the message form. Please refresh.',true));
})();
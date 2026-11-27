(function(){
'use strict';
const $=id=>document.getElementById(id);
function notice(message,kind){const el=$('notice');el.hidden=false;el.className='notice notice-'+(kind||'success');el.textContent=message;}
async function start(){
 const {data:{session}}=await window.sb.auth.getSession();
 if(!session?.user){location.replace('/admin/super-admin-login.html');return;}
 const {data:userData,error:userError}=await window.sb.auth.getUser();
 if(userError||!userData.user){location.replace('/admin/super-admin-login.html');return;}
 const {data:profile,error:profileError}=await window.sb.from('profiles').select('role,is_active,college_id').eq('user_id',userData.user.id).maybeSingle();
 const isSuper=!!profile&&!profileError&&profile.role==='super_admin'&&profile.is_active===true;
 let assignedCollege=null;
 if(profile&&!profileError&&profile.role==='college_admin'&&profile.is_active===true&&profile.college_id){
  const {data:currentCollege,error:collegeError}=await window.sb.rpc('current_college_id');
  if(!collegeError&&currentCollege===profile.college_id)assignedCollege=profile.college_id;
 }
 if(!isSuper&&!assignedCollege){$('gate').textContent='Access denied. Admin permission is required.';return;}
 $('gate').hidden=true;$('admin-content').hidden=false;
 $('admin-email').textContent=userData.user.email||'';
 const audience=$('broadcast-audience'),collegeField=$('college-field'),college=$('broadcast-college'),form=$('broadcast-form'),button=$('send-broadcast');
 if(!isSuper){audience.value='college';audience.disabled=true;collegeField.hidden=false;college.disabled=true;college.required=true;}
 audience.addEventListener('change',()=>{const show=audience.value==='college';collegeField.hidden=!show;college.required=show;});
 try{
  const {data,error}=await window.sb.from('colleges').select('id,name').eq('is_active',true).order('name');
  if(error)throw error;
  (data||[]).filter(item=>!assignedCollege||item.id===assignedCollege).forEach(item=>{const option=document.createElement('option');option.value=item.id;option.textContent=item.name;college.appendChild(option);});
  if(assignedCollege){college.value=assignedCollege;college.disabled=true;}
 }catch(error){console.warn('[admin-notifications] college list unavailable:',error.code||'unknown');}
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  const title=$('broadcast-title').value.trim(),message=$('broadcast-message').value.trim(),url=$('broadcast-url').value.trim()||'/';
  if(!title||!message){notice('Add a title and message before sending.','error');return;}
  if(!url.startsWith('/')||url.startsWith('//')||url.includes('\\')){notice('Enter a valid Hapn path beginning with /.','error');return;}
  if(audience.value==='college'&&!college.value){notice('Choose a college for this audience.','error');return;}
  if(!window.confirm('Send this notification to '+(audience.value==='all'?'all opted-in Hapn users':'verified members of the selected college')+'?'))return;
  button.disabled=true;button.textContent='Sending…';
  try{
   const {data,error}=await window.sb.functions.invoke('send-event-push',{body:{action:'broadcast',title,message,audience:audience.value,collegeId:college.value||null,url}});
   if(error)throw error;
   if(!data||!data.sent){notice(data&&data.message||'No eligible recipients were found.','warn');return;}
    const count=Number.isFinite(data.recipients)?data.recipients+' college members':'all subscribed users';
   notice('Notification submitted to OneSignal for '+count+'.','success');
   form.reset();if(assignedCollege){audience.value='college';college.value=assignedCollege;}audience.dispatchEvent(new Event('change'));
  }catch(error){console.warn('[admin-notifications] broadcast failed:',error.status||error.code||'unknown');notice('Could not send the notification. Check your admin access and try again.','error');}
  finally{button.disabled=false;button.textContent='Send notification';}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
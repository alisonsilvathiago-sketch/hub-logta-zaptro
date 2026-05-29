const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/logDockIntelligence-ZijqQ1c8.js","assets/index-FfDLijDA.js","assets/index-Co106Rvn.css"])))=>i.map(i=>d[i]);
import{r as e,t}from"./index-FfDLijDA.js";var n=async n=>{try{let r=new Date().toISOString().split(`T`)[0];console.log(`[Chat Archiver] Arquivando conversas para empresa: ${n} - Dia: ${r}`);let{data:i,error:a}=await t.from(`chat_messages`).select(`
        id, 
        content, 
        created_at, 
        sender_id, 
        receiver_id, 
        room_id,
        profiles!sender_id (full_name)
      `).eq(`company_id`,n).gte(`created_at`,`${r}T00:00:00Z`);if(a)throw a;if(!i||i.length===0)return{success:!0,archived:0,message:`Nenhuma conversa para arquivar hoje.`};let o={};i.forEach(e=>{let t=e.room_id||`private-${[e.sender_id,e.receiver_id].sort().join(`-`)}`;o[t]||(o[t]=[]),o[t].push(e)});let s=0;for(let[t,i]of Object.entries(o)){i[0].room_id&&`${i[0].room_id}`;let a=`--- LOG DE CONVERSA ${r} ---\nOrigem: Zaptro App\nEmpresa ID: ${n}\nThread: ${t}\n-----------------------------------\n\n`+i.map(e=>`[${new Date(e.created_at).toLocaleTimeString()}] ${e.profiles?.full_name||`Usuário`}: ${e.content}`).join(`
`),o=`conversa-${t}-${r}.txt`,c=new File([a],o,{type:`text/plain`}),{saveEntityToLogDock:l}=await e(async()=>{let{saveEntityToLogDock:e}=await import(`./logDockIntelligence-ZijqQ1c8.js`);return{saveEntityToLogDock:e}},__vite__mapDeps([0,1,2]));(await l({company_id:n,type:`zaptro`,file:c,category:`conversas`,metadata:{thread_id:t,message_count:i.length,archived_at:new Date().toISOString()}})).success&&s++}return{success:!0,archived:s}}catch(e){return console.error(`Chat Archiver Error:`,e),{success:!1,error:e}}};export{n as archiveDailyConversations};
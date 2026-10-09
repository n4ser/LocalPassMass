/* LocalPassMass local bulk-import parser. No file contents leave the extension. */
(() => {
  if (globalThis.LPM_BULK_IMPORT) return;

  function parseCsv(text) {
    const rows=[]; let row=[], cell='', quoted=false;
    text=String(text||'').replace(/^\uFEFF/,'');
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      if(quoted){
        if(ch==='"' && text[i+1]==='"'){cell+='"';i++;}
        else if(ch==='"') quoted=false;
        else cell+=ch;
      }else if(ch==='"') quoted=true;
      else if(ch===','){row.push(cell);cell='';}
      else if(ch==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}
      else cell+=ch;
    }
    if(cell.length||row.length){row.push(cell.replace(/\r$/,''));rows.push(row);}
    return rows.filter(r=>r.some(v=>String(v||'').trim()));
  }

  const key = value => String(value||'').trim().toLowerCase().replace(/[\s_-]+/g,'');
  function first(obj, names){ for(const name of names){ const v=obj[key(name)]; if(v!==undefined && v!==null && String(v)!=='') return v; } return ''; }
  function booleanValue(v){ return v===true || ['1','true','yes','y','favorite'].includes(String(v||'').trim().toLowerCase()); }

  function normalizeRecord(source) {
    const obj={}; for(const [k,v] of Object.entries(source||{})) obj[key(k)]=v;
    const nestedLogin=source?.login && typeof source.login==='object' ? source.login : null;
    const nestedUri=Array.isArray(nestedLogin?.uris) ? nestedLogin.uris.find(item=>item?.uri)?.uri : '';
    const url=nestedUri || first(obj,['url','uri','website','site','login_uri','loginuri']);
    const username=nestedLogin?.username ?? first(obj,['username','user','login_username','loginusername','email']);
    const password=nestedLogin?.password ?? first(obj,['password','pass','passwd','login_password','loginpassword']);
    const title=first(obj,['name','title','site_name','sitename']);
    const notes=source?.notes ?? first(obj,['notes','note','extra','comment','comments']);
    const tags=source?.tags ?? source?.folder ?? first(obj,['tags','tag','folder','group','grouping','collection']);
    const favorite=booleanValue(source?.favorite ?? first(obj,['favorite','fav','starred']));
    return {url:String(url||'').trim(),username:String(username||'').trim(),password:String(password||''),title:String(title||'').trim(),notes:String(notes||''),tags:LPM_ACCOUNT_META?.normalizeTags?.(tags)||[],favorite};
  }

  function recordsFromCsv(text){
    const rows=parseCsv(text); if(rows.length<2)return [];
    const headers=rows[0].map(v=>String(v||'').trim());
    return rows.slice(1).map(row=>normalizeRecord(Object.fromEntries(headers.map((h,i)=>[h,row[i]??'']))));
  }

  function recordsFromJson(text){
    const parsed=JSON.parse(text);
    const list=Array.isArray(parsed)?parsed:(Array.isArray(parsed?.entries)?parsed.entries:(Array.isArray(parsed?.items)?parsed.items:[]));
    const folderNames=new Map((Array.isArray(parsed?.folders)?parsed.folders:[]).filter(x=>x?.id).map(x=>[String(x.id),String(x.name||'').trim()]));
    return list.map(item=>{
      const normalized=normalizeRecord(item);
      const folderName=folderNames.get(String(item?.folderId||''));
      if(folderName) normalized.tags=LPM_ACCOUNT_META?.normalizeTags?.([...(normalized.tags||[]),folderName])||normalized.tags;
      return normalized;
    });
  }

  function parse(text, filename='') {
    const trimmed=String(text||'').trim();
    if(!trimmed)return {entries:[],skipped:0,format:'empty'};
    let records,format;
    if(/\.json$/i.test(filename)||trimmed.startsWith('[')||trimmed.startsWith('{')){records=recordsFromJson(trimmed);format='json';}
    else {records=recordsFromCsv(text);format='csv';}
    const valid=[], seen=new Set(); let skipped=0;
    for(const item of records){
      if(!item.url||!item.password){skipped++;continue;}
      const sig=[item.url,item.username,item.password].join('\u001f');
      if(seen.has(sig)){skipped++;continue;} seen.add(sig); valid.push(item);
    }
    return {entries:valid,skipped,format};
  }

  globalThis.LPM_BULK_IMPORT=Object.freeze({parse,parseCsv,normalizeRecord});
})();

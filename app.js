const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.getElementById('mobile-nav');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  menuButton.setAttribute('aria-label', open ? '展开导航' : '收起导航');
  mobileNav.hidden = open;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mobileNav.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', '展开导航');
}));
const caseData = {
  education: { category: '教育学 · 选题与结构辅导', title: '让研究问题聚焦，让论证有据可依',
    challenge: '展示场景：选题范围较大，现有材料之间缺少清晰联系，尚未形成贯穿全文的研究问题。',
    steps: ['讨论研究对象与具体问题，明确文章要回答什么。','检查已有文献与材料，区分事实依据、研究观点和待补充证据。','重新梳理章节关系，形成问题、方法、结果与讨论相互对应的提纲。','围绕目标期刊的选题范围和稿件要求，逐项核对投稿准备。'] },
  management: { category: '管理学 · 研究方法与论证辅导', title: '让分析过程清楚，让结论回应问题',
    challenge: '展示场景：已有研究数据与分析结果，但方法选择、变量关系和结果讨论的说明不够清楚。',
    steps: ['从研究问题出发，讲解方法选择与适用条件。','检查分析过程的可说明性与结果表达，标注需要作者补充的依据。','区分数据结果与解释性判断，完善讨论和研究局限。','统一图表、引用与稿件格式，准备正式提交材料。'] },
  submission: { category: '跨学科 · 选刊与投稿辅导', title: '找到合适的期刊，做好提交前的每一项',
    challenge: '展示场景：初稿已经完成，需要确认期刊是否适配，以及投稿材料是否齐全。',
    steps: ['对照期刊官方网站，核对选题范围、稿件类型和作者指南。','根据期刊要求，检查文章结构、摘要、引用与图表格式。','辅导准备投稿附信、作者信息及期刊要求的其他材料。','逐项核对投稿系统并完成提交，保存真实投稿确认记录。'] }
};
const caseDialog = document.getElementById('case-dialog');
let caseTrigger = null;
document.querySelectorAll('[data-case]').forEach(button => button.addEventListener('click', () => {
  const item = caseData[button.dataset.case];
  if (!item || !caseDialog) return;
  caseTrigger = button;
  document.getElementById('case-dialog-category').textContent = item.category;
  document.getElementById('case-dialog-title').textContent = item.title;
  document.getElementById('case-dialog-challenge').textContent = item.challenge;
  const list = document.getElementById('case-dialog-steps');
  list.replaceChildren(...item.steps.map(text => {const li = document.createElement('li');li.textContent = text;return li;}));
  caseDialog.showModal();
  document.body.style.overflow = 'hidden';
}));
document.querySelector('.dialog-close')?.addEventListener('click', () => caseDialog.close());
caseDialog?.addEventListener('close', () => {document.body.style.overflow = '';caseTrigger?.focus();});
caseDialog?.addEventListener('click', event => {
  const box = caseDialog.getBoundingClientRect();
  if (event.target === caseDialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) caseDialog.close();
});
document.getElementById('current-year').textContent = String(new Date().getFullYear());
if (document.body.dataset.page === 'home') {
const desktopLinks = document.querySelectorAll('.header-inner nav a');
const visibleSections = new Map();
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => visibleSections.set(entry.target.id, entry.isIntersecting));
  const section = ['team','notes','disciplines','journals','services','main'].find(id => visibleSections.get(id));
  if (section) desktopLinks.forEach(link => {
    const active = link.getAttribute('href') === '#'+section || link.getAttribute('href') === '/'+section+'/';
    link.classList.toggle('active', active);
    if(active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
}, {rootMargin:'-15% 0px -45% 0px',threshold:0});
['main','services','journals','disciplines','notes','team'].forEach(id => {const element = document.getElementById(id); if (element) sectionObserver.observe(element);});
}

// Copy the published WeChat account; keep manual selection available when blocked.
(() => {
 const button=document.querySelector('[data-copy-wechat]');
 const account=document.getElementById('wechat-account');
 const status=document.getElementById('wechat-copy-status');
 if(!button||!account||!status)return;
 let reset;
 button.addEventListener('click',async()=>{
  clearTimeout(reset);button.disabled=true;
  try{
   if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
   await navigator.clipboard.writeText(account.textContent.trim());
   button.textContent='已复制';
   status.textContent='微信号已复制，请打开微信搜索添加。';
  }catch{
   const range=document.createRange();range.selectNodeContents(account);
   const selection=window.getSelection();selection?.removeAllRanges();selection?.addRange(range);
   button.textContent='复制微信号';
   status.textContent='请长按或选中复制微信号：'+account.textContent.trim();
  }finally{
   button.disabled=false;
   reset=setTimeout(()=>{button.textContent='复制微信号';},2500);
  }
 });
})();

import { getGlassTheme } from './glass-theme.js';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LiquiGlass, LiquiThemeProvider } from '@liqui-design/glass';
import { Tabs } from '@base-ui/react/tabs';
import { Dialog } from '@base-ui/react/dialog';
import { Popover } from '@base-ui/react/popover';
import { ArrowUpRight, Sun, Moon, Github, Mail, GraduationCap, University, BookOpen, Layers, Compass, BriefcaseBusiness, FlaskConical, X, ImagePlus, MessageCircleQuestion, BookHeart, ImageMinus, FileText, QrCode, Code2, Globe, Presentation } from 'lucide-react';
import { Button } from './components/button';
import content from './content.json';
import publicationsData from '../publications.json';
import projectsData from '../projects.json';
import './site.css';

const socialLinks = [
  ['Google Scholar', '谷歌学术', 'https://scholar.google.com/citations?user=uM4iaOUAAAAJ&hl=zh-CN', GraduationCap],
  ['GitHub', 'GitHub', 'https://github.com/melmaphother', Github],
  ['Zhihu', '知乎', 'https://www.zhihu.com/people/melmaphother/posts', MessageCircleQuestion],
  ['Xiaohongshu', '小红书', 'https://www.xiaohongshu.com/user/profile/6126f8a100000000010058b0?m_source=pwa', BookHeart],
];
const tools = [
  ['Nanobanana Peel', 'AI image background removal', 'AI 图像去背景', 'nanobanana-peel/', ImageMinus],
  ['TexPurify', 'A cleaner canvas for LaTeX', '清除 LaTeX 文本格式', 'texpurify/', FileText],
  ['QRStamp', 'Make a QR code your own', '定制你的专属二维码', 'qrstamp/', QrCode],
];
const sections = [
  ['about', 'Research', '研究', Compass],
  ['publications', 'Publications', '论文', BookOpen],
  ['projects', 'Projects', '项目', Layers],
  ['experiences', 'Journey', '经历', BriefcaseBusiness],
];
const linkLabels = { pdf: ['Paper', '论文'], code: ['Code', '代码'], project: ['Website', '项目主页'], website: ['Website', '网站'], poster: ['Poster', '海报'], slides: ['Slides', '幻灯片'] };
const linkIcons = { pdf: FileText, code: Code2, project: Globe, website: Globe, poster: Presentation, slides: Presentation };
function Panel({ className = '', children }) { return <div className={`academic-panel ${className}`}>{children}</div>; }
function Surface({ className = '', children, ...props }) {
  return <LiquiGlass elevated radius={28} bezel={20} refraction={48} blur={0.35} className={`surface ${className}`} {...props}>{children}</LiquiGlass>;
}
function Segments({ value, onChange, items, label }) {
  return <Surface radius={100} bezel={10} refraction={48} className="segment-surface">
    <Tabs.Root value={value} onValueChange={onChange}>
      <Tabs.List aria-label={label} className="segments">
        <Tabs.Indicator className="segment-indicator" />
        {items.map(([key, text]) => <Tabs.Tab key={key} value={key} className="segment">{text}</Tabs.Tab>)}
      </Tabs.List>
    </Tabs.Root>
  </Surface>;
}
function Legacy({ name }) {
  return <div className="legacy-content" dangerouslySetInnerHTML={{ __html: content[name] }} />;
}
function SectionHeading({ t, number, title, zh, subtitle, subtitleZh, filter, onFilter }) {
  return <div className="section-heading">
    <div><div className="eyebrow"><span>{number}</span>{t(subtitle, subtitleZh)}</div><h2>{t(title, zh)}</h2></div>
    {filter && <Segments label={t('Show items', '筛选条目')} value={filter} onChange={onFilter} items={[[ 'selected', t('Selected', '精选') ], [ 'all', t('All', '全部') ]]} />}
  </div>;
}
function WorkCard({ item, type, index, t, onPreview }) {
  return <article className={`work-card ${type}`}>
    <button className="work-image" onClick={() => onPreview(item)} aria-label={t(`Enlarge figure: ${item.title}`, `查看大图：${item.title}`)}>
      <img src={item.thumbnail} alt={item.title} loading="lazy" />
      <span className="image-hint"><ImagePlus size={16} /></span>
    </button>
    <div className="work-content">
      <div className="work-meta"><span className="work-index">{String(index + 1).padStart(2, '0')}</span><span className="venue-badge">{item.award || (type === 'publication' ? 'Preprint' : t('Open source', '开源项目'))}</span></div>
      <h3>{item.title}</h3>
      <p className="authors">{item.authors.map((author, i) => <React.Fragment key={`${author}-${i}`}>{i > 0 && ', '}{author.includes('Daoyu Wang') ? <strong>{author}</strong> : author}</React.Fragment>)}</p>
      <p className="venue">{item.venue}</p>
      <div className="work-links">{Object.entries(item.links || {}).map(([key, href]) => { const Icon = linkIcons[key] || Globe; return <a key={key} href={href} target="_blank" rel="noreferrer"><Icon size={14} aria-hidden="true" />{t(...(linkLabels[key] || [key, key]))}</a>; })}</div>
    </div>
  </article>;
}
function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('homepage-language') || 'en');
  const [dark, setDark] = useState(() => localStorage.getItem('homepage-theme') === 'dark');
  const [pubFilter, setPubFilter] = useState('selected');
  const [projectFilter, setProjectFilter] = useState('selected');
  const [active, setActive] = useState('about');
  const [preview, setPreview] = useState(null);
  const t = (en, zh) => lang === 'zh' ? zh : en;
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.body.className = `lang-${lang}`;
    document.title = 'Daoyu Wang - Homepage';
    localStorage.setItem('homepage-language', lang);
  }, [lang]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('homepage-theme', dark ? 'dark' : 'light');
  }, [dark]);
  useEffect(() => {
    const syncTheme = (event) => {
      if (event.key === 'homepage-theme') setDark(event.newValue === 'dark');
    };
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: '-18% 0px -55% 0px' });
    sections.forEach(([id]) => { const node = document.getElementById(id); if (node) observer.observe(node); });
    return () => observer.disconnect();
  }, []);
  return <LiquiThemeProvider theme={{ glass: getGlassTheme(dark) }}>
    <a href="#about" className="skip-link">{t('Skip to content', '跳至正文')}</a>
    <div className="topbar-wrap">
      <Surface className="topbar" radius={100} bezel={17} refraction={75} dispersion={0.025}>
        <a className="wordmark" href="#top" aria-label={t('Daoyu Wang, back to top', '王道宇，回到顶部')}><img src="images/favicon/android-chrome-512x512.png" alt="" /><span>Daoyu Wang</span></a>
        <nav className="desktop-nav" aria-label={t('Main navigation', '主导航')}>{sections.map(([id, en, zh, Icon]) => <a key={id} href={`#${id}`} className={active === id ? 'active' : ''} aria-current={active === id ? 'location' : undefined}><Icon size={14} aria-hidden="true" />{t(en, zh)}</a>)}</nav>
        <div className="nav-controls"><Segments label={t('Language', '语言')} value={lang} onChange={setLang} items={[[ 'en', 'EN' ], [ 'zh', '中文' ]]} /><a className="icon-button" href="https://github.com/Melmaphother/Melmaphother.github.io" target="_blank" rel="noreferrer" aria-label={t('View source on GitHub', '在 GitHub 查看源码')} title={t('View source', '查看源码')}><Github size={18} aria-hidden="true" /></a><button className="icon-button" onClick={() => setDark(!dark)} aria-label={t(dark ? 'Switch to light theme' : 'Switch to dark theme', dark ? '切换浅色主题' : '切换深色主题')}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button></div>
      </Surface>
    </div>
    <main id="top" className="page">
      <aside className="profile-sidebar">
      <header className="hero">
        <div className="hero-copy">
          <h1><span className={`name-primary ${lang === 'zh' ? 'chinese-name' : ''}`}>{t('Daoyu Wang', '王道宇')}</span><span className={`name-secondary ${lang === 'en' ? 'chinese-name' : ''}`}>{t('王道宇', 'Daoyu Wang')}</span></h1>
          <p className="academic-role"><University size={15} aria-hidden="true" /><span>{t('CS Master Student · University of Science and Technology of China', '计算机科学与技术硕士在读 · 中国科学技术大学')}</span></p>
          <a className="email-link" href="mailto:daoyu.wang@mail.ustc.edu.cn"><Mail size={15} aria-hidden="true" /><span>daoyu.wang@mail.ustc.edu.cn</span></a>
          <div className="social-links">{socialLinks.map(([en, zh, href, Icon]) => <a href={href} key={en} target="_blank" rel="noreferrer"><Icon size={15} aria-hidden="true" />{t(en, zh)}</a>)}</div>
        </div>
        <img className="academic-portrait" src="images/profile.png" alt={t('Portrait of Daoyu Wang', '王道宇的照片')} fetchPriority="high" />
      </header>
      </aside>
      <div className="details-column">
      <div className="intro-grid">
        <Panel className="section-surface intro-section"><div id="about" className="section-anchor" /><SectionHeading t={t} number="01" title="About Me" zh="关于我" subtitle="THE PERSON" subtitleZh="研究者" /><Legacy name="about" /></Panel>
        <Panel className="section-surface interest-section"><div id="research-interest" className="section-anchor" /><SectionHeading t={t} number="02" title="Research Interests" zh="研究兴趣" subtitle="THE QUESTIONS" subtitleZh="探索方向" /><Legacy name="research-interest" /></Panel>
      </div>
      <section id="publications" className="work-section">
        <SectionHeading t={t} number="03" title="Publications" zh="论文与研究" subtitle="PUBLICATIONS" subtitleZh="学术论文" filter={pubFilter} onFilter={setPubFilter} />
        <Panel className="work-surface"><div className="work-list">{publicationsData.publications.filter(p => pubFilter === 'all' || p.selected === 1).map((p, i) => <WorkCard t={t} onPreview={setPreview} key={p.title} item={p} type="publication" index={i} />)}</div></Panel>

      </section>
      <section id="projects" className="work-section">
        <SectionHeading t={t} number="04" title="Projects & Competitions" zh="项目与竞赛" subtitle="PROJECTS & COMPETITIONS" subtitleZh="开源与实践" filter={projectFilter} onFilter={setProjectFilter} />
        <div className="project-grid">{projectsData.projects.filter(p => projectFilter === 'all' || p.selected === 1).map((p, i) => <Panel key={p.title} className="project-surface"><WorkCard t={t} onPreview={setPreview} item={p} type="project" index={i} /></Panel>)}</div>
      </section>
      <div className="journey-grid">
        <Panel className="section-surface awards-surface"><div id="awards" className="section-anchor" /><SectionHeading t={t} number="05" title="Awards" zh="荣誉奖项" subtitle="RECOGNITION" subtitleZh="成长印记" /><Legacy name="awards" /></Panel>
        <Panel className="section-surface experiences-surface"><div id="experiences" className="section-anchor" /><SectionHeading t={t} number="06" title="Experience & Education" zh="经历与教育" subtitle="EXPERIENCE & EDUCATION" subtitleZh="我的旅程" /><Legacy name="experiences" /></Panel>
      </div>
      <div className="footer-content"><Legacy name="footer" /><div className="footer-colophon"><span>© {new Date().getFullYear()} Daoyu Wang</span><span><a href="https://github.com/Melmaphother/Melmaphother.github.io" target="_blank" rel="noreferrer">{t('View source', '查看源码')}<Github size={13} aria-hidden="true" /></a></span></div></div>
      </div>
    </main>
    <Popover.Root>
      <Surface className="tools-trigger-surface" radius={100} bezel={12} refraction={48}><Popover.Trigger className="tools-trigger"><FlaskConical size={20} /><span>{t('More works', '更多工具')}</span><span className="tools-plus">+</span></Popover.Trigger></Surface>
      <Popover.Portal><Popover.Positioner side="top" align="end" sideOffset={14} collisionPadding={18} className="tools-positioner"><Popover.Popup render={<Surface className="tools-panel" radius={26} bezel={20} refraction={55} frost={0.2} />}><Popover.Title className="tools-title">{t('More Works', '更多工具')}</Popover.Title><p className="tools-subtitle">{t('A few things I have built.', '我构建的一些小作品。')}</p>{tools.map(([title, en, zh, href, Icon]) => <a key={title} href={href} className="tool-link" target="_blank" rel="noreferrer"><span className="tool-icon"><Icon size={22} aria-hidden="true" /></span><div><strong>{title}</strong><span>{t(en, zh)}</span></div><ArrowUpRight size={17} /></a>)}</Popover.Popup></Popover.Positioner></Popover.Portal>
    </Popover.Root>
    <Dialog.Root open={!!preview} onOpenChange={open => { if (!open) setPreview(null); }}>
      <Dialog.Portal><Dialog.Backdrop className="dialog-backdrop" /><Dialog.Popup aria-describedby={undefined} render={<Surface className="image-dialog" radius={18} bezel={12} refraction={45} frost={0.16} />}><div className="dialog-header"><Dialog.Title className="preview-title">{preview?.title}</Dialog.Title><Dialog.Close nativeButton={false} render={<Button size="sm" glass={{ radius: 100, bezel: 8 }} className="dialog-close-button" />} aria-label={t('Close image', '关闭图片')}><X size={21} /></Dialog.Close></div>{preview && <img className="preview-image" src={preview.thumbnail} alt={preview.title} />}</Dialog.Popup></Dialog.Portal>
    </Dialog.Root>
  </LiquiThemeProvider>;
}
createRoot(document.getElementById('root')).render(<App />);

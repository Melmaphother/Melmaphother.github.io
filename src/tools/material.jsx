import { getGlassTheme } from '../glass-theme.js';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LiquiGlass, LiquiThemeProvider } from '@liqui-design/glass';
import { Popover } from '@base-ui/react/popover';
import { Sun, Moon, House, Github, ChevronDown, FlaskConical, ImageMinus, FileText, QrCode, Ban, Upload, SlidersHorizontal, RotateCw, Copy, Download, WandSparkles, Check, TriangleAlert, X, Clipboard, ShieldCheck } from 'lucide-react';
import './tools.css';

const tools = [
  ['nanobanana-peel', 'Nanobanana Peel', 'Remove image backgrounds', ImageMinus],
  ['texpurify', 'TexPurify', 'Clean LaTeX formatting', FileText],
  ['qrstamp', 'QRStamp', 'Create custom QR codes', QrCode],
];
const current = tools.find(([slug]) => slug === document.body.dataset.tool);
const iconMap = { Ban, QrCode, Upload, SlidersHorizontal, RotateCw, Copy, Download, WandSparkles, Check, TriangleAlert, X, Clipboard, ShieldCheck, Github, ChevronDown, FileText, ImageMinus };
const roots = [];
const initialDark = localStorage.getItem('homepage-theme') === 'dark';
document.documentElement.dataset.theme = initialDark ? 'dark' : 'light';

function useTheme() {
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark');
  useEffect(() => {
    const refresh = () => setDark(document.documentElement.dataset.theme === 'dark');
    const storage = (event) => {
      if (event.key === 'homepage-theme') {
        document.documentElement.dataset.theme = event.newValue === 'dark' ? 'dark' : 'light';
        refresh();
      }
    };
    document.addEventListener('tool-theme', refresh);
    window.addEventListener('storage', storage);
    return () => { document.removeEventListener('tool-theme', refresh); window.removeEventListener('storage', storage); };
  }, []);
  return dark;
}
function Theme({ children }) {
  const dark = useTheme();
  return <LiquiThemeProvider theme={{ glass: getGlassTheme(dark) }}>{children}</LiquiThemeProvider>;
}
function Glass({ className = '', children, radius = 100, ...props }) {
  return <LiquiGlass elevated radius={radius} bezel={12} refraction={48} blur={0.35} className={`tool-glass ${className}`} {...props}>{children}</LiquiGlass>;
}
function Header() {
  const dark = useTheme();
  const [, name, , Icon] = current;
  function toggleTheme() {
    const value = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = value;
    localStorage.setItem('homepage-theme', value);
    document.dispatchEvent(new Event('tool-theme'));
  }
  return <Theme><Glass className="tool-nav" bezel={17} refraction={75} dispersion={0.025}>
    <a className="tool-nav-brand" href={`/${current[0]}/`}><Icon size={22} /><span>{name}</span></a>
    <div className="tool-nav-actions">
      <Popover.Root><Popover.Trigger className="tool-nav-button tool-switcher" aria-label="Switch tool"><FlaskConical size={17} /><span>Tools</span><ChevronDown size={14} /></Popover.Trigger>
        <Popover.Portal><Popover.Positioner side="bottom" align="end" sideOffset={12} collisionPadding={16} className="tool-switcher-positioner"><Popover.Popup render={<Glass className="tool-switcher-menu" radius={22} frost={0.2} />}><Popover.Title className="tool-menu-title">Small tools</Popover.Title>{tools.map(([slug,title,description,ToolIcon]) => <a className={`tool-menu-link ${slug === current[0] ? 'current' : ''}`} key={slug} href={`/${slug}/`} aria-current={slug === current[0] ? 'page' : undefined}><ToolIcon size={20} /><span><strong>{title}</strong><small>{description}</small></span>{slug === current[0] && <Check size={15} />}</a>)}</Popover.Popup></Popover.Positioner></Popover.Portal>
      </Popover.Root>
      <a className="tool-nav-button" href="/" aria-label="Back to homepage" title="Back to homepage"><House size={18} /></a>
      <a className="tool-nav-button" href="https://github.com/Melmaphother/Melmaphother.github.io" target="_blank" rel="noreferrer" aria-label="View source on GitHub" title="View source"><Github size={18} /></a>
      <button className="tool-nav-button" type="button" onClick={toggleTheme} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} title={dark ? 'Light theme' : 'Dark theme'}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
    </div>
  </Glass></Theme>;
}

function mount(node, element) {
  const root = createRoot(node);
  roots.push(root);
  root.render(element);
  return root;
}
mount(document.getElementById('tool-chrome'), <Header />);
for (const node of document.querySelectorAll('[data-icon]')) {
  const Icon = iconMap[node.dataset.icon];
  if (Icon) mount(node, <Icon size={18} aria-hidden="true" />);
}
// Add an independent glass backing without replacing native controls or their
// event listeners. Processing, clipboard, export and selected-state logic stay
// owned by each tool. Only chrome and material surfaces are shared.
const surfaceSelectors = '.action-btn, .settings-toggle, .toast, .segmented, .edge-tabs, .logo-color-mode, .format-switch, .background-switch, .size-switch, .download-button, .reset-button, .secondary-actions button, .corner-menu';
for (const host of document.querySelectorAll(surfaceSelectors)) {
  host.classList.add('tool-glass-host');
  const backing = document.createElement('span');
  backing.className = 'tool-material';
  backing.setAttribute('aria-hidden', 'true');
  host.appendChild(backing);
  const popup = host.matches('.toast, .corner-menu');
  mount(backing, <Theme><Glass className="tool-material-glass" radius={popup ? 18 : 100} frost={popup ? 0.2 : 0.08} /></Theme>);
}
const toastIcon = document.querySelector('.toast-icon');
if (toastIcon) {
  const root = mount(toastIcon, <Check size={18} aria-hidden="true" />);
  document.addEventListener('tool-toast', (event) => {
    const Icon = { '✅': Check, '⚠️': TriangleAlert, '❌': X, '📋': Clipboard, '⬇️': Download }[event.detail] || Check;
    root.render(<Icon size={18} aria-hidden="true" />);
  });
}
const upload = document.querySelector('body[data-tool="nanobanana-peel"] #upload-zone');
if (upload) {
  upload.setAttribute('tabindex', '0');
  upload.setAttribute('role', 'button');
  upload.setAttribute('aria-label', 'Upload an image');
  upload.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); document.getElementById('file-input').click(); }
  });
}
const settingsToggle = document.getElementById('settings-toggle');
if (settingsToggle) {
  const panel = document.getElementById('settings-panel');
  const update = () => settingsToggle.setAttribute('aria-expanded', !panel.classList.contains('collapsed'));
  settingsToggle.setAttribute('aria-controls', 'settings-grid');
  update();
  settingsToggle.addEventListener('click', update);
}

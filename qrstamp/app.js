(() => {
    'use strict';

    const $ = (selector, parent = document) => parent.querySelector(selector);
    const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];

    const defaults = {
        url: '',
        name: '',
        dotStyle: 'square',
        edgeMode: 'all',
        edgePreset: 'square',
        customCorners: [
            ['square', 'square'],
            ['square', 'square'],
            ['square', 'square']
        ],
        colorMode: 'solid',
        solidColor: '#17161a',
        gradientStart: '#7c3aed',
        gradientEnd: '#ec4899',
        gradientMid: '',
        gradientType: 'linear',
        gradientAngle: 135,
        logo: '',
        customLogo: '',
        logoColorMode: 'brand',
        logoColor: '#18171b',
        logoSize: 20,
        logoPadding: 5,
        format: 'png'
    };

    const state = {
        ...defaults,
        customCorners: defaults.customCorners.map((corner) => [...corner])
    };
    let currentSvg = '';
    let renderTimer = null;

    const el = {
        form: $('#config-form'),
        url: $('#url-input'),
        name: $('#name-input'),
        filenameMessage: $('#filename-message'),
        urlField: $('.url-field'),
        urlMessage: $('#url-message'),
        preview: $('#qr-preview'),
        placeholder: $('#placeholder'),
        download: $('#download-button'),
        downloadText: $('#download-button span'),
        downloadMeta: $('#download-meta'),
        contrastWarning: $('#contrast-warning'),
        solidPanel: $('#solid-panel'),
        gradientPanel: $('#gradient-panel'),
        solidPicker: $('#solid-picker'),
        customSwatch: $('.custom-swatch'),
        edgeAllPanel: $('#edge-all-panel'),
        edgeCustomPanel: $('#edge-custom-panel'),
        logoGrid: $('#logo-grid'),
        uploadZone: $('#upload-zone'),
        logoUpload: $('#logo-upload'),
        uploadMessage: $('#upload-message'),
        logoSettings: $('#logo-settings'),
        logoColorControls: $('#logo-color-controls'),
        logoColorPickerLabel: $('#logo-color-picker-label'),
        logoColorPicker: $('#logo-color-picker'),
        logoCustomSwatch: $('.logo-custom-swatch'),
        logoSize: $('#logo-size'),
        logoSizeOutput: $('#logo-size-output'),
        logoPadding: $('#logo-padding'),
        logoPaddingOutput: $('#logo-padding-output')
    };

    const brandMap = {
        github: 'assets/logos/github.svg',
        arxiv: 'assets/logos/arxiv.svg',
        gmail: 'assets/logos/gmail.svg',
        mail: 'assets/logos/mail.svg',
        huggingface: 'assets/logos/huggingface.svg',
        x: 'assets/logos/x.svg',
        linkedin: 'assets/logos/linkedin.svg',
        youtube: 'assets/logos/youtube.svg',
        discord: 'assets/logos/discord.svg',
        wechat: 'assets/logos/wechat.svg',
        sinaweibo: 'assets/logos/sinaweibo.svg',
        zhihu: 'assets/logos/zhihu.svg',
        bilibili: 'assets/logos/bilibili.svg',
        tiktok: 'assets/logos/tiktok.svg',
        xiaohongshu: 'assets/logos/xiaohongshu.svg'
    };
    const brandColors = {
        github: '#181717',
        arxiv: '#b31b1b',
        gmail: '#ea4335',
        mail: '#18171b',
        huggingface: '#fbd21e',
        x: '#000000',
        linkedin: '#0a66c2',
        youtube: '#ff0000',
        discord: '#5865f2',
        wechat: '#07c160',
        sinaweibo: '#e6162d',
        zhihu: '#0084ff',
        bilibili: '#00a1d6',
        tiktok: '#000000',
        xiaohongshu: '#ff2442'
    };
    const brandSvgCache = new Map();

    const sameCorners = (outer, center = outer) => ({
        corners: [
            [outer, center],
            [outer, center],
            [outer, center]
        ]
    });

    const edgePresets = {
        square: sameCorners('square'),
        rounded: sameCorners('rounded'),
        circle: sameCorners('circle'),
        'leaf-tl': sameCorners('leaf-tl'),
        'leaf-tr': sameCorners('leaf-tr'),
        'leaf-br': sameCorners('leaf-br'),
        'leaf-bl': sameCorners('leaf-bl'),
        'notch-tl': sameCorners('notch-tl', 'circle'),
        'notch-tr': sameCorners('notch-tr', 'circle'),
        'notch-br': sameCorners('notch-br', 'circle'),
        'notch-bl': sameCorners('notch-bl', 'circle'),
        'arc-tl': sameCorners('arc-tl'),
        'arc-tr': sameCorners('arc-tr'),
        'arc-br': sameCorners('arc-br'),
        'arc-bl': sameCorners('arc-bl'),
        'dot-square': sameCorners('dot-square', 'dot-square'),
        'dot-rounded': sameCorners('dot-rounded', 'dot-rounded'),
        'dot-dense': sameCorners('dot-dense', 'dot-dense')
    };

    function escapeXml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&apos;');
    }

    function isValidUri(value) {
        const text = value.trim();
        if (!text || !/^[a-z][a-z0-9+.-]*:/i.test(text)) return false;
        if (/^(javascript|data|vbscript):/i.test(text)) return false;
        try {
            const parsed = new URL(text);
            return Boolean(parsed.protocol);
        } catch {
            return /^(mailto|tel|sms|geo|urn):\S+/i.test(text);
        }
    }

    function isEmailAddress(value) {
        const text = value.trim();
        return !/^[a-z][a-z0-9+.-]*:/i.test(text)
            && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
    }

    function normalizeQrContent(value) {
        const text = value.trim();
        return isEmailAddress(text) ? `mailto:${text}` : text;
    }

    function sanitizeFilename(value) {
        const cleaned = value
            .trim()
            .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
            .replace(/[.\s]+$/g, '')
            .slice(0, 80);
        return cleaned || 'qrcode';
    }

    function updateFilenameMessage() {
        const base = sanitizeFilename(state.name);
        el.filenameMessage.textContent =
            `Your file will be saved as ${base}.png or ${base}.svg.`;
    }

    function hexToRgb(hex) {
        const value = hex.replace('#', '');
        if (!/^[0-9a-f]{6}$/i.test(value)) return null;
        return {
            r: parseInt(value.slice(0, 2), 16),
            g: parseInt(value.slice(2, 4), 16),
            b: parseInt(value.slice(4, 6), 16)
        };
    }

    function normalizeHex(value) {
        const raw = value.trim();
        const match = raw.match(/^#?([0-9a-f]{6})$/i);
        return match ? `#${match[1].toLowerCase()}` : null;
    }

    function contrastWithWhite(hex) {
        const rgb = hexToRgb(hex);
        if (!rgb) return 21;
        const channel = (value) => {
            const s = value / 255;
            return s <= .03928 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
        };
        const luminance = .2126 * channel(rgb.r) + .7152 * channel(rgb.g) + .0722 * channel(rgb.b);
        return 1.05 / (luminance + .05);
    }

    function shapePreviewElement(x, y, style, fill = 'currentColor') {
        const polygon = (points) => `<path d="${points.map(([px, py], index) => `${index ? 'L' : 'M'}${x + px} ${y + py}`).join('')}Z" fill="${fill}"/>`;
        if (style === 'dots') return `<circle cx="${x + 2.5}" cy="${y + 2.5}" r="2.45" fill="${fill}"/>`;
        if (style === 'rounded') return `<rect x="${x + .2}" y="${y + .2}" width="4.6" height="4.6" rx="1.35" fill="${fill}"/>`;
        if (style === 'gap-square') return `<rect x="${x + .55}" y="${y + .55}" width="3.9" height="3.9" fill="${fill}"/>`;
        if (style === 'diamond') return polygon([[2.5, 0], [5, 2.5], [2.5, 5], [0, 2.5]]);
        if (style === 'star') return polygon([[2.5, 0], [3.1, 1.8], [5, 1.8], [3.45, 2.85], [4, 4.8], [2.5, 3.55], [1, 4.8], [1.55, 2.85], [0, 1.8], [1.9, 1.8]]);
        if (style === 'heart') {
            return `<path d="M${x + 2.5} ${y + 4.75}C${x + .9} ${y + 3.35} ${x + .25} ${y + 2.45} ${x + .25} ${y + 1.45}C${x + .25} ${y + .55} ${x + .95} ${y + .15} ${x + 1.7} ${y + .15}C${x + 2.15} ${y + .15} ${x + 2.45} ${y + .4} ${x + 2.5} ${y + .82}C${x + 2.7} ${y + .4} ${x + 3.05} ${y + .15} ${x + 3.5} ${y + .15}C${x + 4.3} ${y + .15} ${x + 4.75} ${y + .7} ${x + 4.75} ${y + 1.45}C${x + 4.75} ${y + 2.45} ${x + 4.1} ${y + 3.35} ${x + 2.5} ${y + 4.75}Z" fill="${fill}"/>`;
        }
        if (style === 'hexagon') return polygon([[1.25, .15], [3.75, .15], [5, 2.5], [3.75, 4.85], [1.25, 4.85], [0, 2.5]]);
        if (style === 'sparkle') return polygon([[2.5, 0], [3.1, 1.9], [5, 2.5], [3.1, 3.1], [2.5, 5], [1.9, 3.1], [0, 2.5], [1.9, 1.9]]);
        if (style === 'clover') {
            return `<path d="M${x + 2.5} ${y + 1.35}C${x + 2.5} ${y + .25} ${x + 4} ${y + .25} ${x + 3.9} ${y + 1.65}C${x + 5} ${y + 1.35} ${x + 5} ${y + 3} ${x + 3.6} ${y + 2.9}C${x + 4.1} ${y + 4.25} ${x + 2.5} ${y + 4.75} ${x + 2.5} ${y + 3.35}C${x + 2.5} ${y + 4.75} ${x + .9} ${y + 4.25} ${x + 1.4} ${y + 2.9}C${x} ${y + 3} ${x} ${y + 1.35} ${x + 1.1} ${y + 1.65}C${x + 1} ${y + .25} ${x + 2.5} ${y + .25} ${x + 2.5} ${y + 1.35}Z" fill="${fill}"/>`;
        }
        return `<rect x="${x}" y="${y}" width="5" height="5" fill="${fill}"/>`;
    }

    function createShapePreviewSvg(style) {
        const rawCells = [
            [1, 0], [2, 0], [3, 0],
            [1, 1], [3, 1], [5, 1], [6, 1],
            [1, 2], [2, 2], [3, 2], [5, 2],
            [2, 3], [4, 3], [5, 3], [6, 3],
            [1, 4], [3, 4], [5, 4],
            [2, 5], [4, 5], [6, 5]
        ];
        const cellSize = style === 'gap-square' ? 6 : 5.6;
        const gap = 1.45;
        const minCol = Math.min(...rawCells.map(([col]) => col));
        const maxCol = Math.max(...rawCells.map(([col]) => col));
        const minRow = Math.min(...rawCells.map(([, row]) => row));
        const maxRow = Math.max(...rawCells.map(([, row]) => row));
        const patternWidth = (maxCol - minCol) * (cellSize + gap) + cellSize;
        const patternHeight = (maxRow - minRow) * (cellSize + gap) + cellSize;
        const offsetX = (58 - patternWidth) / 2;
        const offsetY = (48 - patternHeight) / 2;
        const cells = rawCells.map(([col, row]) => [col - minCol, row - minRow]);
        const parts = cells.map(([col, row]) => shapePreviewElement(offsetX + col * (cellSize + gap), offsetY + row * (cellSize + gap), style));
        return `<svg viewBox="0 0 58 48" aria-hidden="true"><g>${parts.join('')}</g></svg>`;
    }

    function renderShapeDemos() {
        $$('.shape-card').forEach((button) => {
            const demo = $('.shape-demo', button);
            if (demo) demo.innerHTML = createShapePreviewSvg(button.dataset.dotStyle);
        });
    }

    function colorizeBrandSvg(svg, color) {
        const cleaned = svg
            .replace(/\sfill="(?!none)[^"]*"/gi, '')
            .replace(/\sstroke="(?!none)[^"]*"/gi, '');
        return cleaned.replace('<svg', `<svg fill="${color}"`);
    }

    function colorizeLinkedinSvg(svg, color) {
        return svg.replace(/fill="(?:#0077b5|#0a66c2)"/gi, `fill="${color}"`);
    }

    function brandSvgForMode(name, svg) {
        const color = state.logoColorMode === 'custom'
            ? state.logoColor
            : brandColors[name] || '#18171b';
        if (name === 'linkedin') return colorizeLinkedinSvg(svg, color);
        return colorizeBrandSvg(svg, color);
    }

    function validateAndRender(showEmptyError = false) {
        const value = state.url.trim();
        const content = normalizeQrContent(value);
        const email = isEmailAddress(value);
        const valid = isValidUri(content);
        const empty = !value;

        el.urlField.classList.toggle('invalid', (!empty || showEmptyError) && !valid);
        el.urlMessage.classList.toggle('error', (!empty || showEmptyError) && !valid);

        if (empty) {
            el.urlMessage.textContent = showEmptyError
                ? 'A URL or email is required.'
                : 'Enter a complete link, URI, or email address.';
        } else if (!valid) {
            el.urlMessage.textContent = 'This URL or email is not valid. Check the address and try again.';
        } else if (email) {
            el.urlMessage.textContent = `Email recognized. The QR code will encode ${content}.`;
        } else {
            el.urlMessage.textContent = 'Looks good. The QR code is updating in real time.';
        }

        el.download.disabled = !valid;
        if (!valid) {
            currentSvg = '';
            el.preview.innerHTML = '';
            el.preview.classList.remove('visible');
            el.placeholder.classList.remove('hidden');
            return;
        }

        try {
            currentSvg = createQrSvg(content);
            el.preview.innerHTML = currentSvg;
            el.preview.classList.add('visible');
            el.placeholder.classList.add('hidden');
        } catch (error) {
            currentSvg = '';
            el.download.disabled = true;
            el.preview.classList.remove('visible');
            el.placeholder.classList.remove('hidden');
            el.urlField.classList.add('invalid');
            el.urlMessage.classList.add('error');
            el.urlMessage.textContent = 'This content is too long for a QR code. Shorten it and try again.';
            console.error(error);
        }
    }

    function queueRender() {
        clearTimeout(renderTimer);
        renderTimer = setTimeout(() => validateAndRender(false), 30);
        updateContrastWarning();
    }

    function isFinderCell(row, col, count) {
        const topLeft = row < 7 && col < 7;
        const topRight = row < 7 && col >= count - 7;
        const bottomLeft = row >= count - 7 && col < 7;
        return topLeft || topRight || bottomLeft;
    }

    function dotElement(row, col, style, fill) {
        const x = col + 4;
        const y = row + 4;
        const polygon = (points) => `<path d="${points.map(([px, py], index) => `${index ? 'L' : 'M'}${x + px} ${y + py}`).join('')}Z" fill="${fill}"/>`;
        if (style === 'dots') {
            return `<circle cx="${x + .5}" cy="${y + .5}" r=".43" fill="${fill}"/>`;
        }
        if (style === 'rounded') {
            return `<rect x="${x + .05}" y="${y + .05}" width=".9" height=".9" rx=".3" fill="${fill}"/>`;
        }
        if (style === 'gap-square') {
            return `<rect x="${x + .11}" y="${y + .11}" width=".78" height=".78" fill="${fill}"/>`;
        }
        if (style === 'diamond') {
            return `<path d="M${x + .5} ${y + .03} ${x + .97} ${y + .5} ${x + .5} ${y + .97} ${x + .03} ${y + .5}Z" fill="${fill}"/>`;
        }
        if (style === 'star') {
            return polygon([[.5, .03], [.62, .36], [.97, .36], [.68, .56], [.8, .93], [.5, .7], [.2, .93], [.32, .56], [.03, .36], [.38, .36]]);
        }
        if (style === 'heart') {
            return `<path d="M${x + .5} ${y + .92}C${x + .18} ${y + .65} ${x + .05} ${y + .48} ${x + .05} ${y + .29}C${x + .05} ${y + .12} ${x + .18} ${y + .03} ${x + .34} ${y + .03}C${x + .43} ${y + .03} ${x + .49} ${y + .08} ${x + .5} ${y + .16}C${x + .54} ${y + .08} ${x + .61} ${y + .03} ${x + .7} ${y + .03}C${x + .86} ${y + .03} ${x + .95} ${y + .14} ${x + .95} ${y + .29}C${x + .95} ${y + .48} ${x + .82} ${y + .65} ${x + .5} ${y + .92}Z" fill="${fill}"/>`;
        }
        if (style === 'hexagon') {
            return polygon([[.25, .05], [.75, .05], [.98, .5], [.75, .95], [.25, .95], [.02, .5]]);
        }
        if (style === 'sparkle') {
            return polygon([[.5, .02], [.62, .38], [.98, .5], [.62, .62], [.5, .98], [.38, .62], [.02, .5], [.38, .38]]);
        }
        if (style === 'clover') {
            return `<path d="M${x + .5} ${y + .28}C${x + .5} ${y + .05} ${x + .82} ${y + .05} ${x + .8} ${y + .34}C${x + 1} ${y + .29} ${x + 1} ${y + .62} ${x + .72} ${y + .58}C${x + .82} ${y + .85} ${x + .5} ${y + .95} ${x + .5} ${y + .68}C${x + .5} ${y + .95} ${x + .18} ${y + .85} ${x + .28} ${y + .58}C${x} ${y + .62} ${x} ${y + .29} ${x + .2} ${y + .34}C${x + .18} ${y + .05} ${x + .5} ${y + .05} ${x + .5} ${y + .28}Z" fill="${fill}"/>`;
        }
        return `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`;
    }

    function selectiveRoundedRectPath(x, y, size, radii) {
        const [topLeft, topRight, bottomRight, bottomLeft] = radii;
        const right = x + size;
        const bottom = y + size;
        return [
            `M${x + topLeft} ${y}`,
            `H${right - topRight}`,
            topRight ? `Q${right} ${y} ${right} ${y + topRight}` : `H${right}`,
            `V${bottom - bottomRight}`,
            bottomRight ? `Q${right} ${bottom} ${right - bottomRight} ${bottom}` : `V${bottom}`,
            `H${x + bottomLeft}`,
            bottomLeft ? `Q${x} ${bottom} ${x} ${bottom - bottomLeft}` : `H${x}`,
            `V${y + topLeft}`,
            topLeft ? `Q${x} ${y} ${x + topLeft} ${y}` : `V${y}`,
            'Z'
        ].join('');
    }

    function shapeRect(x, y, size, style, fill) {
        if (style === 'circle') {
            return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2}" fill="${fill}"/>`;
        }
        if (style.startsWith('arc')) {
            const right = x + size;
            const bottom = y + size;
            const centerX = x + size / 2;
            const centerY = y + size / 2;
            const radius = size / 2;
            const paths = {
                'arc-tl': `M${centerX} ${y}A${radius} ${radius} 0 1 1 ${x} ${centerY}L${x} ${y}Z`,
                'arc-tr': `M${right} ${centerY}A${radius} ${radius} 0 1 1 ${centerX} ${y}L${right} ${y}Z`,
                'arc-br': `M${centerX} ${bottom}A${radius} ${radius} 0 1 1 ${right} ${centerY}L${right} ${bottom}Z`,
                'arc-bl': `M${x} ${centerY}A${radius} ${radius} 0 1 1 ${centerX} ${bottom}L${x} ${bottom}Z`
            };
            return `<path d="${paths[style]}" fill="${fill}"/>`;
        }
        if (style.startsWith('notch')) {
            const mapped = style.replace('notch', 'leaf');
            return shapeRect(x, y, size, mapped, fill);
        }
        if (style.startsWith('leaf')) {
            const r = Math.max(.45, size * .34);
            const radiiByStyle = {
                'leaf-tl': [0, r, r, r],
                'leaf-tr': [r, 0, r, r],
                'leaf-br': [r, r, 0, r],
                'leaf-bl': [r, r, r, 0]
            };
            return `<path d="${selectiveRoundedRectPath(x, y, size, radiiByStyle[style])}" fill="${fill}"/>`;
        }
        const radius = style === 'rounded' ? Math.max(.45, size * .2) : 0;
        return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" fill="${fill}"/>`;
    }

    function dottedFinderElement(x, y, style, fill) {
        const dense = style === 'dot-dense';
        const rounded = style === 'dot-rounded';
        const size = dense ? .9 : .72;
        const offset = (1 - size) / 2;
        const radius = rounded ? size / 2 : dense ? .2 : 0;
        const dots = [];
        for (let i = 0; i < 7; i += 1) {
            for (let j = 0; j < 7; j += 1) {
                const border = i === 0 || i === 6 || j === 0 || j === 6;
                const center = i >= 2 && i <= 4 && j >= 2 && j <= 4;
                if (border || center) {
                    dots.push(`<rect x="${x + j + offset}" y="${y + i + offset}" width="${size}" height="${size}" rx="${radius}" fill="${fill}"/>`);
                }
            }
        }
        return dots.join('');
    }

    function finderShapeElement(x, y, outerStyle, centerStyle, fill) {
        if (outerStyle === 'dot-square' || outerStyle === 'dot-rounded' || outerStyle === 'dot-dense') {
            return dottedFinderElement(x, y, outerStyle, fill);
        }
        return [
            shapeRect(x, y, 7, outerStyle, fill),
            shapeRect(x + 1, y + 1, 5, outerStyle, '#ffffff'),
            shapeRect(x + 2, y + 2, 3, centerStyle, fill)
        ].join('');
    }

    function finderElement(row, col, outerStyle, centerStyle, fill) {
        return finderShapeElement(col + 4, row + 4, outerStyle, centerStyle, fill);
    }

    function finderPreviewElement(x, y, scale, outerStyle, centerStyle) {
        const finder = finderShapeElement(0, 0, outerStyle, centerStyle, 'currentColor');
        return `<g transform="translate(${x} ${y}) scale(${scale})">${finder}</g>`;
    }

    function createEdgePresetPreviewSvg(preset) {
        const corners = edgePresets[preset].corners;
        return `<svg viewBox="0 0 58 48" aria-hidden="true">
            ${finderPreviewElement(11.5, 6.5, 5, corners[0][0], corners[0][1])}
        </svg>`;
    }

    function centerStyleForCorner(style) {
        return style.startsWith('notch') ? 'circle' : style;
    }

    function createSingleEdgePreviewSvg(style) {
        const centerStyle = centerStyleForCorner(style);
        return `<svg viewBox="0 0 38 38" aria-hidden="true">
            ${finderPreviewElement(5, 5, 4, style, centerStyle)}
        </svg>`;
    }

    function renderEdgeDemos() {
        $$('.edge-card[data-edge-preset]').forEach((button) => {
            const demo = $('.edge-demo', button);
            if (demo) demo.innerHTML = createEdgePresetPreviewSvg(button.dataset.edgePreset);
        });
        $$('.corner-menu button[data-corner-style]').forEach((button) => {
            const demo = $('.edge-demo', button);
            if (demo) demo.innerHTML = createSingleEdgePreviewSvg(button.dataset.cornerStyle);
        });
        $$('.corner-trigger .edge-demo').forEach((demo) => {
            demo.innerHTML = createSingleEdgePreviewSvg('square');
        });
    }

    function gradientDefinition(total) {
        if (state.colorMode === 'solid') return '';
        const midStop = state.gradientMid
            ? `<stop offset="50%" stop-color="${state.gradientMid}"/>`
            : '';
        if (state.gradientType === 'radial') {
            return `<radialGradient id="qrFill" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stop-color="${state.gradientStart}"/>
                ${midStop}
                <stop offset="100%" stop-color="${state.gradientEnd}"/>
            </radialGradient>`;
        }
        const angle = (Number(state.gradientAngle) - 90) * Math.PI / 180;
        const x = Math.cos(angle);
        const y = Math.sin(angle);
        const x1 = ((1 - x) / 2 * total).toFixed(2);
        const y1 = ((1 - y) / 2 * total).toFixed(2);
        const x2 = ((1 + x) / 2 * total).toFixed(2);
        const y2 = ((1 + y) / 2 * total).toFixed(2);
        return `<linearGradient id="qrFill" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
            <stop offset="0%" stop-color="${state.gradientStart}"/>
            ${midStop}
            <stop offset="100%" stop-color="${state.gradientEnd}"/>
        </linearGradient>`;
    }

    function brandLogoDataUri(name) {
        const svg = brandSvgCache.get(name);
        if (!svg) return '';
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(brandSvgForMode(name, svg))}`;
    }

    async function preloadBrandLogo(name) {
        const source = brandMap[name];
        if (!source || brandSvgCache.has(name)) return;
        try {
            const response = await fetch(source);
            if (!response.ok) throw new Error(`Unable to load ${source}`);
            const svg = await response.text();
            brandSvgCache.set(name, svg);
            updateLogoOptionIcon(name);
            if (state.logo === name && !state.customLogo) queueRender();
        } catch (error) {
            console.warn(error);
        }
    }

    function updateLogoOptionIcon(name) {
        const image = $(`.logo-option[data-logo="${name}"] img`);
        const svg = brandSvgCache.get(name);
        if (!image || !svg) return;
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(brandSvgForMode(name, svg))}`;
    }

    function updateAllLogoOptionIcons() {
        Object.keys(brandMap).forEach((name) => {
            if (brandSvgCache.has(name)) updateLogoOptionIcon(name);
            else preloadBrandLogo(name);
        });
    }

    function logoElement(total) {
        const source = state.customLogo || brandLogoDataUri(state.logo);
        if (!source) return '';
        const imageSize = total * (state.logoSize / 100);
        const pad = total * (state.logoPadding / 100);
        const boxSize = imageSize + pad;
        const boxX = (total - boxSize) / 2;
        const imageX = (total - imageSize) / 2;
        return `<g>
            <rect x="${boxX}" y="${boxX}" width="${boxSize}" height="${boxSize}" rx="${boxSize * .18}" fill="#ffffff"/>
            <image href="${escapeXml(source)}" x="${imageX}" y="${imageX}" width="${imageSize}" height="${imageSize}" preserveAspectRatio="xMidYMid meet"/>
        </g>`;
    }

    function createQrSvg(value) {
        const hasLogo = Boolean(state.logo || state.customLogo);
        const qr = qrcode(0, hasLogo ? 'H' : 'M');
        qr.addData(value, 'Byte');
        qr.make();

        const count = qr.getModuleCount();
        const total = count + 8;
        const fill = state.colorMode === 'gradient' ? 'url(#qrFill)' : state.solidColor;
        const modules = [];

        for (let row = 0; row < count; row += 1) {
            for (let col = 0; col < count; col += 1) {
                if (qr.isDark(row, col) && !isFinderCell(row, col, count)) {
                    modules.push(dotElement(row, col, state.dotStyle, fill));
                }
            }
        }

        const corners = state.edgeMode === 'custom'
            ? state.customCorners
            : edgePresets[state.edgePreset].corners;
        const finders = [
            finderElement(0, 0, corners[0][0], corners[0][1], fill),
            finderElement(0, count - 7, corners[1][0], corners[1][1], fill),
            finderElement(count - 7, 0, corners[2][0], corners[2][1], fill)
        ].join('');

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="geometricPrecision" aria-hidden="true">
            <rect width="${total}" height="${total}" fill="#ffffff"/>
            <defs>${gradientDefinition(total)}</defs>
            ${modules.join('')}
            ${finders}
            ${logoElement(total)}
        </svg>`;
    }

    function updateContrastWarning() {
        const colors = state.colorMode === 'solid'
            ? [state.solidColor]
            : [state.gradientStart, state.gradientEnd, state.gradientMid].filter(Boolean);
        const risk = colors.some((color) => contrastWithWhite(color) < 3);
        el.contrastWarning.classList.toggle('hidden', !risk);
    }

    function setColorMode(mode) {
        state.colorMode = mode;
        $$('[data-color-mode]').forEach((button) => {
            const active = button.dataset.colorMode === mode;
            button.classList.toggle('active', active);
            button.setAttribute('aria-selected', active);
        });
        el.solidPanel.classList.toggle('hidden', mode !== 'solid');
        el.gradientPanel.classList.toggle('hidden', mode !== 'gradient');
        queueRender();
    }

    function setDotStyle(style) {
        state.dotStyle = style;
        $$('.shape-card').forEach((button) => {
            const active = button.dataset.dotStyle === style;
            button.classList.toggle('active', active);
            button.setAttribute('aria-checked', active);
        });
        queueRender();
    }

    function setEdgeMode(mode) {
        state.edgeMode = mode;
        $$('[data-edge-mode]').forEach((button) => {
            const active = button.dataset.edgeMode === mode;
            button.classList.toggle('active', active);
            button.setAttribute('aria-selected', active);
        });
        el.edgeAllPanel.classList.toggle('hidden', mode !== 'all');
        el.edgeCustomPanel.classList.toggle('hidden', mode !== 'custom');
        if (mode === 'all') setEdgePreset(state.edgePreset || 'square');
        else queueRender();
    }

    function setEdgePreset(preset) {
        state.edgePreset = preset;
        $$('[data-edge-preset]').forEach((button) => {
            const active = button.dataset.edgePreset === preset;
            button.classList.toggle('active', active);
            button.setAttribute('aria-checked', active);
        });
        queueRender();
    }

    function setCustomCorner(index, style) {
        state.customCorners[index] = [
            style,
            centerStyleForCorner(style)
        ];
        queueRender();
    }

    function setCornerPickerUi(picker, style) {
        const selectedButton = $(`[data-corner-style="${style}"]`, picker);
        const triggerDemo = $('.corner-trigger .edge-demo', picker);
        $$('.corner-menu button', picker).forEach((button) => {
            button.classList.toggle('active', button.dataset.cornerStyle === style);
        });
        if (selectedButton && triggerDemo) {
            const selectedDemo = $('.edge-demo', selectedButton);
            triggerDemo.className = selectedDemo.className;
            triggerDemo.innerHTML = selectedDemo.innerHTML;
        }
    }

    function setLogo(name, customSource = '') {
        state.logo = name;
        state.customLogo = customSource;
        if (name && !customSource) preloadBrandLogo(name);
        $$('.logo-option').forEach((button) => {
            const active = !customSource && button.dataset.logo === name;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', active);
        });
        el.logoSettings.classList.toggle('hidden', !(name || customSource));
        el.logoColorControls.classList.toggle('hidden', Boolean(customSource));
        if (name && !customSource) {
            const color = brandColors[name] || defaults.logoColor;
            if (state.logoColorMode === 'brand') el.logoColorPicker.value = color;
        }
        el.uploadMessage.textContent = customSource ? 'Custom logo loaded. It stays local in your browser.' : '';
        el.uploadMessage.classList.remove('error');
        queueRender();
    }

    function setLogoColorMode(mode) {
        state.logoColorMode = mode;
        $$('[data-logo-color-mode]').forEach((button) => {
            const active = button.dataset.logoColorMode === mode;
            button.classList.toggle('active', active);
            button.setAttribute('aria-selected', active);
        });
        el.logoColorPickerLabel.classList.toggle('hidden', mode !== 'custom');
        if (mode === 'brand' && state.logo) {
            el.logoColorPicker.value = brandColors[state.logo] || defaults.logoColor;
        }
        updateAllLogoOptionIcons();
        queueRender();
    }

    function handleLogoFile(file) {
        if (!file) return;
        const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            el.uploadMessage.textContent = 'Unsupported format. Choose PNG, JPG, JPEG, or WebP.';
            el.uploadMessage.classList.add('error');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            el.uploadMessage.textContent = 'This image is too large. Choose a logo under 5 MB.';
            el.uploadMessage.classList.add('error');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setLogo('custom', reader.result);
        reader.onerror = () => {
            el.uploadMessage.textContent = 'Could not read this image. Please try again.';
            el.uploadMessage.classList.add('error');
        };
        reader.readAsDataURL(file);
    }

    function handleLogoPaste(event) {
        const activeElement = document.activeElement;
        const isTyping = activeElement && ['INPUT', 'TEXTAREA'].includes(activeElement.tagName);
        const isUploadFocused = activeElement === el.uploadZone;
        if (isTyping && !isUploadFocused) return;

        const imageFile = [...event.clipboardData.files].find((file) => file.type.startsWith('image/'));
        if (!imageFile) return;

        event.preventDefault();
        handleLogoFile(imageFile);
    }


    function setFormat(format) {
        state.format = format;
        $$('[data-format]').forEach((button) => {
            button.classList.toggle('active', button.dataset.format === format);
        });
        if (format === 'png') {
            el.downloadText.textContent = 'Download PNG';
            el.downloadMeta.textContent = '2048 × 2048 px · Good for web and social';
        } else {
            el.downloadText.textContent = 'Download SVG';
            el.downloadMeta.textContent = 'Vector format · Good for print and editing';
        }
        updateFilenameMessage();
    }

    function triggerDownload(blob, extension) {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${sanitizeFilename(state.name)}.${extension}`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function downloadSvg() {
        const content = `<?xml version="1.0" encoding="UTF-8"?>\n${currentSvg}`;
        triggerDownload(new Blob([content], { type: 'image/svg+xml;charset=utf-8' }), 'svg');
    }

    function downloadPng() {
        const blob = new Blob([currentSvg], { type: 'image/svg+xml;charset=utf-8' });
        const objectUrl = URL.createObjectURL(blob);
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 2048;
            canvas.height = 2048;
            const context = canvas.getContext('2d');
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(objectUrl);
            canvas.toBlob((pngBlob) => {
                if (pngBlob) triggerDownload(pngBlob, 'png');
            }, 'image/png');
        };
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            alert('PNG export failed. Try SVG or export again.');
        };
        image.src = objectUrl;
    }

    function resetAll() {
        Object.assign(state, {
            ...defaults,
            customCorners: defaults.customCorners.map((corner) => [...corner])
        });
        el.url.value = '';
        el.name.value = '';
        el.solidPicker.value = defaults.solidColor;
        el.customSwatch.style.setProperty('--selected-color', defaults.solidColor);
        el.logoSize.value = String(defaults.logoSize);
        el.logoPadding.value = String(defaults.logoPadding);
        el.logoColorPicker.value = defaults.logoColor;
        el.logoCustomSwatch.style.setProperty('--selected-logo-color', defaults.logoColor);
        el.logoSizeOutput.value = `${defaults.logoSize}%`;
        el.logoPaddingOutput.value = `${defaults.logoPadding}%`;
        el.logoUpload.value = '';
        $$('.swatch').forEach((item) => item.classList.toggle('active', item.dataset.color === defaults.solidColor));
        el.customSwatch.classList.remove('active');
        $$('.gradient-presets button').forEach((item, index) => item.classList.toggle('active', index === 0));
        $$('.logo-swatch').forEach((item) => item.classList.toggle('active', item.dataset.logoColor === defaults.logoColor));
        el.logoCustomSwatch.classList.remove('active');
        setDotStyle(defaults.dotStyle);
        setEdgeMode(defaults.edgeMode);
        setEdgePreset(defaults.edgePreset);
        $$('.corner-picker').forEach((picker) => setCornerPickerUi(picker, 'square'));
        setColorMode('solid');
        setLogoColorMode('brand');
        setLogo('');
        setFormat('png');
        validateAndRender(false);
        el.url.focus();
    }

    el.url.addEventListener('input', () => {
        state.url = el.url.value;
        queueRender();
    });

    el.url.addEventListener('blur', () => validateAndRender(Boolean(state.url.trim())));
    el.name.addEventListener('input', () => {
        state.name = el.name.value;
        updateFilenameMessage();
    });

    $$('.shape-card').forEach((button) => {
        button.addEventListener('click', () => setDotStyle(button.dataset.dotStyle));
    });

    $$('[data-edge-mode]').forEach((button) => {
        button.addEventListener('click', () => setEdgeMode(button.dataset.edgeMode));
    });

    $$('[data-edge-preset]').forEach((button) => {
        button.addEventListener('click', () => setEdgePreset(button.dataset.edgePreset));
    });

    $$('.corner-trigger').forEach((button) => {
        button.addEventListener('click', () => {
            const picker = button.closest('.corner-picker');
            $$('.corner-picker').forEach((item) => {
                if (item !== picker) item.classList.remove('open');
            });
            picker.classList.toggle('open');
        });
    });

    $$('.corner-menu button').forEach((button) => {
        button.addEventListener('click', () => {
            const picker = button.closest('.corner-picker');
            const index = Number(picker.dataset.customCorner);
            const style = button.dataset.cornerStyle;
            setCustomCorner(index, style);
            setCornerPickerUi(picker, style);
            picker.classList.remove('open');
        });
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.corner-picker')) {
            $$('.corner-picker').forEach((picker) => picker.classList.remove('open'));
        }
    });

    $$('[data-color-mode]').forEach((button) => {
        button.addEventListener('click', () => setColorMode(button.dataset.colorMode));
    });

    $$('.swatch').forEach((button) => {
        button.addEventListener('click', () => {
            state.solidColor = button.dataset.color;
            el.solidPicker.value = state.solidColor;
            $$('.swatch').forEach((item) => item.classList.toggle('active', item === button));
            el.customSwatch.classList.remove('active');
            queueRender();
        });
    });

    el.solidPicker.addEventListener('input', () => {
        state.solidColor = el.solidPicker.value;
        el.customSwatch.style.setProperty('--selected-color', state.solidColor);
        el.customSwatch.classList.add('active');
        $$('.swatch').forEach((item) => item.classList.remove('active'));
        queueRender();
    });

    $$('.gradient-presets button').forEach((button) => {
        button.addEventListener('click', () => {
            state.gradientStart = button.dataset.start;
            state.gradientEnd = button.dataset.end;
            state.gradientMid = button.dataset.mid || '';
            state.gradientType = button.dataset.type || 'linear';
            state.gradientAngle = Number(button.dataset.angle || defaults.gradientAngle);
            $$('.gradient-presets button').forEach((item) => item.classList.toggle('active', item === button));
            queueRender();
        });
    });

    $$('.logo-option').forEach((button) => {
        button.addEventListener('click', () => setLogo(button.dataset.logo));
    });

    $$('[data-logo-color-mode]').forEach((button) => {
        button.addEventListener('click', () => setLogoColorMode(button.dataset.logoColorMode));
    });

    $$('.logo-swatch').forEach((button) => {
        button.addEventListener('click', () => {
            state.logoColor = button.dataset.logoColor;
            el.logoColorPicker.value = state.logoColor;
            el.logoCustomSwatch.style.setProperty('--selected-logo-color', state.logoColor);
            $$('.logo-swatch').forEach((item) => item.classList.toggle('active', item === button));
            el.logoCustomSwatch.classList.remove('active');
            updateAllLogoOptionIcons();
            queueRender();
        });
    });

    el.logoColorPicker.addEventListener('input', () => {
        state.logoColor = el.logoColorPicker.value;
        el.logoCustomSwatch.style.setProperty('--selected-logo-color', state.logoColor);
        el.logoCustomSwatch.classList.add('active');
        $$('.logo-swatch').forEach((item) => item.classList.remove('active'));
        updateAllLogoOptionIcons();
        queueRender();
    });

    el.uploadZone.addEventListener('click', () => el.logoUpload.click());
    el.uploadZone.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            el.logoUpload.click();
        }
    });
    el.logoUpload.addEventListener('change', () => handleLogoFile(el.logoUpload.files[0]));
    document.addEventListener('paste', handleLogoPaste);

    ['dragenter', 'dragover'].forEach((eventName) => {
        el.uploadZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            el.uploadZone.classList.add('dragging');
        });
    });
    ['dragleave', 'drop'].forEach((eventName) => {
        el.uploadZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            el.uploadZone.classList.remove('dragging');
        });
    });
    el.uploadZone.addEventListener('drop', (event) => handleLogoFile(event.dataTransfer.files[0]));

    el.logoSize.addEventListener('input', () => {
        state.logoSize = Number(el.logoSize.value);
        el.logoSizeOutput.value = `${state.logoSize}%`;
        queueRender();
    });
    el.logoPadding.addEventListener('input', () => {
        state.logoPadding = Number(el.logoPadding.value);
        el.logoPaddingOutput.value = `${state.logoPadding}%`;
        queueRender();
    });
    $('#remove-logo').addEventListener('click', () => setLogo(''));

    $$('[data-format]').forEach((button) => {
        button.addEventListener('click', () => setFormat(button.dataset.format));
    });

    el.download.addEventListener('click', () => {
        if (!isValidUri(normalizeQrContent(state.url)) || !currentSvg) {
            validateAndRender(true);
            return;
        }
        if (state.format === 'svg') downloadSvg();
        else downloadPng();
    });

    $('#reset-all').addEventListener('click', resetAll);
    renderShapeDemos();
    renderEdgeDemos();
    updateAllLogoOptionIcons();
    validateAndRender(false);
})();

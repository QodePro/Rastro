// section v1.0.0
// Copyright 2025 OverAI
// Developed by OverAI (tk)
// Licensed under MIT (LICENSE)

(function() {  // <-- Inicio de la IIFE -->
    
    /*----------------------------------------
    ---------- Rutas y Localización 
    ----------------------------------------*/

    const rout = (key) => {
        const { pathname = '', search = '' } = location;
        
        const routeInfo = {
            tab: pathname.split('/')[1] || '',
            search: search.split('?q=')[1] || '',
            label: pathname.match(/\/label\/([^/]*)/i)?.[1] || '',
            cont: pathname.split('/')[2] || '',
            page: pathname.match(/page=(\d+)/i)?.[1] || '',
            rout: pathname,
        };
    
        return routeInfo[key] || '';
    };

    /*----------------------------------------
    ---- Renderizado de Pestañas/Secciones
    ----------------------------------------*/

    const element = document.getElementById('root');
    const mains = document.querySelectorAll('template[path]');
    let clickCount = 0;
    let lockedTab = null;
    let htmlt = '';

    const tabs = () => {
        if (!element) return;

        const url = rout('tab') || '/';
        if (lockedTab === url) return;

        let html = '';
        if (["pay"].includes(url)) {
            html = htmlt;
        } else {
            mains.forEach((main) => {
                const path = main.getAttribute("path");
                if (url === path || path === "main") {
                    html += main.innerHTML;
                }
            });
        }

        element.innerHTML = html;
        element.className = clickCount++ % 2 ? 'right' : 'left';
        lockedTab = url;
    };

    /*----------------------------------------
    -- Configuración de Formulario (PayPal)
    ----------------------------------------*/
    
    const formulario = async (url, datos) => {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datos)
            });
            return res.ok ? 'Enviado' : 'Error al enviar';
        } catch {
            return 'Error de conexión';
        }
    };

    const setupForm = (base) => {
        const $ = id => document.getElementById(id);
        const name = $('enlace-name');
        const email = $('enlace-email');
        const message = $('enlace-textarea');
        const btn = $('enlace-button');

        const updateTotal = () => {
            const isValid = name?.value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.value);
            if (btn) btn.style.cssText = isValid 
                ? 'pointer-events: auto; opacity: 1' 
                : 'pointer-events: none; opacity: 0.5';
        };
        
        [name, email].forEach(el => 
            el?.addEventListener('input', updateTotal)
        );
        
        updateTotal();

        btn?.addEventListener('click', async (e) => {
            e.preventDefault();

            formulario(base.formUrl, {
                Name: name.value.trim(),
                Email: email.value.trim(),
                Message: message.value.trim()
            });

            btn.textContent = 'Enviando ✓';
            setTimeout(() => btn.textContent = 'Enviar', 5000);
        });
    };

    /*----------------------------------------
    -- Configuración de Formulario (PayPal)
    ----------------------------------------*/

    const setupPayp = ({ price, title }, base) => {
        const $ = id => document.getElementById(id);
        const name = $('enlace-name');
        const email = $('enlace-email');
        const quantity = $('enlace-quantity');
        const total = $('enlace-total');
        const paypal = $('enlace-paypal');
        const alert = $('enlace-alert');
        
        const priceNum = parseFloat(price.replace('$', ''));
        
        const updateTotal = () => {
            const qty = parseInt(quantity?.value || 1);
            const isValid = name?.value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.value);
            
            if (paypal) paypal.style.cssText = isValid 
                ? 'pointer-events: auto; opacity: 1' 
                : 'pointer-events: none; opacity: 0.5';
            
            if (total) total.textContent = `Total $${(qty * priceNum).toFixed(2)}`;
        };
        
        [name, email, quantity].forEach(el => 
            el?.addEventListener('input', updateTotal)
        );
        
        updateTotal();
        
        if (!paypal || !window.paypal) return;
        
        window.paypal.Buttons({
            style: base.pays.style,
            createOrder: (data, actions) => {
                const qty = parseInt(quantity?.value || 1);
                return actions.order.create({
                    intent: 'CAPTURE',
                    purchase_units: [{
                        name: title,
                        quantity: qty,
                        amount: {
                            currency_code: 'USD',
                            value: (qty * priceNum).toFixed(2)
                        },
                        description: title,
                        category: "PHYSICAL_GOODS"
                    }]
                });
            },
            onApprove: (data, actions) => {
                return actions.order.capture().then(details => {
                    const qty = parseInt(quantity?.value || 1);
                    formulario(base.formUrl, {
                        Name: name?.value?.trim() || '',
                        Email: email?.value?.trim() || '',
                        Title: title,
                        Quantity: qty,
                        Total: (qty * priceNum).toFixed(2)
                    });
                    
                    if (alert) {
                        alert.className = 'paypal--valid';
                        alert.innerHTML = `
                            <div class="icono">✓</div>
                            <div class="titulo">¡Gracias, ${name?.value?.trim()}!</div>
                            <div class="subtitulo">Tu orden ha sido enviada exitosamente.</div>
                            <div class="info">
                                <div><strong>Correo:</strong> ${email?.value?.trim()}</div>
                                <div><strong>ID de transacción:</strong> ${details.id}</div>
                                <div><strong>Total pagado:</strong> ${(qty * priceNum).toFixed(2)} USD</div>
                            </div>
                        `;
                    }
                });
            },
            onError: () => {
                if (alert) {
                    alert.className = 'paypal--error';
                    alert.innerHTML = 'Error al procesar el pago';
                }
            }
        }).render(paypal);
    };

    /*----------------------------------------
    ------- Procesamiento de Shortcodes
    ----------------------------------------*/

    function shortcodes(content) {
        let data = ''; let html = '';

        content.replace(/@([a-zA-Z-]+)([\s\S]*?)@([a-zA-Z-]+)/g, (_, open, inners, close) => {
            let processed = '';
            let cleanInner = inners.replace(/<(?!\/?img|\/?div)[^>]+>/g, '');

            if (open !== close) return;

            inners.replace(/\w+-(\w+)\((.*?)\)(?:-(\w+)\((.*?)\))?-/g, (_, key, inner, name, numbr) => {
                processed += `
                ${{pay: '<a to="pay.url">', url: `<a href="${numbr}" target="_blank">`}[name] || ''}
                    <div class="${open}-${key}">${inner}</div>
                    ${name === "pay" || name === "url" ? '</a>' : ''}
                `;
                if (name === "pay") data = numbr;
            });

            html += processed
                ? `<div class="${open}">${processed}</div>`
                : `<div class="${open}">${cleanInner}</div>`;
        });

        return { html, data };
    }

    /*----------------------------------------
    - Plantilla de Datos de Entrada (Entry)
    ----------------------------------------*/

    const temp = (entry, limit) => {
        const DEFAULT = 'default data';
        let title = entry?.title?.$t || DEFAULT;
        let content = entry?.content?.$t || DEFAULT;
        const bodyent = shortcodes(content);

        return {
            title: title,
            price: bodyent.data,
            url: (title?.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-') + '.html') || DEFAULT,
            author: `<img src='${entry?.author?.[0]?.gd$image?.src || DEFAULT}'>`,
            authorName: entry?.author?.[0]?.name?.$t || DEFAULT,
            color: entry?.category?.[0]?.term || [],
            label: entry?.category?.map(cat => cat.term || []) || [],
            date: new Date(entry?.updated?.$t || DEFAULT).toLocaleDateString(),
            image: `<img src='${entry?.media$thumbnail?.url?.replace("s72", limit || "s1000") || DEFAULT}'>`,
            description: content.replace(/<[^>]*>/g, '').replace(/@([a-zA-Z-]+)[\s\S]*?@([a-zA-Z-]+)/g, ''),
            body: bodyent.html || "No se detectó ninguna etiqueta",
        };
    };

    /*----------------------------------------
    ----- Procesador Principal de Bucles
    ----------------------------------------*/
    
    let dato = {};
    
    const processLoop = (content, envio, handleContent) => {
        const processContent = (base) => (_, type, {}, cont) => {
            const feed = base[type.split(':')[0]]?.feed;
            return handleContent(cont, feed, type, base);
        };
        return content
            ?.replace(/^[\s\S]*?(<new-loop[^>]*>[\s\S]*?<\/new-loop>)[\s\S]*$/, "$1")
            ?.replace(/<new-loop data="(.*?)" var="(.*?)">([\s\S]*?)<\/new-loop>/g, processContent(envio)) || '';
    };

    const headHandler = (content, envio) => {
        const handleContent = (cont, feed, {}) => {
            return cont
                .replace(/<new-head:"(\w+)">/g, (_, o) => [o] || '')
                .replace(/<new-head\.\.(\w+)>/g, (_, o) => feed?.[o]?.$t || '')
                .replace(/<new-head\.logo\.text>/g, feed?.title?.$t || '')
                .replace(/<new-head\.subtitle>/g, feed?.subtitle?.$t || '')
                .replace(/<new-head\.author>/g, `<img src='https://${feed?.author?.[0]?.gd$image?.src || ''}'>`)
                .replace(/<new-head\.name>/g, feed?.author?.[0]?.name?.$t || '')
                .replace(/<new-head\.input>/g, `<input placeholder="Búsqueda"/>`);
        };
        return processLoop(content, envio, handleContent);
    };

    const postHandler = (content, envio) => {
        const handleContent = (cont, feed, type, base) => {
            let [typ = '', category = '', max = ''] = type?.split(':') || [];
                
            const labelSet = (base.noLabl[typ] || '').toLowerCase().split(':');
            const label = (rout("label") || category).toLowerCase();
            const page = Number(rout("page")) || 1;
            const searchTerm = rout("search")?.trim() || "";

            const filteredPosts = (feed?.entry || []).filter(post => {
                if (!post.category?.length) return false;
                
                const labelMatch = label === "explorer"
                    ? !post.category.some(c => labelSet.includes(c.term.toLowerCase()))
                    : post.category.some(c => c.term.toLowerCase().includes(label));
                
                return labelMatch && post.title.$t.toLowerCase().includes(searchTerm.toLowerCase());
            });             

            if (!feed || filteredPosts.length === 0) {
                if (!feed) {
                    return '<p>Error: Unable to load feed data</p>';
                }
            
                dato[typ] = dato[typ] || { totalPages: 0, olderPage: 1, newerPage: 1 };
            
                const message = searchTerm 
                    ? `No posts found for "${searchTerm}"`
                    : `No ${label} posts available`;
            
                return `<p>${message}</p>`;
            }               

            const start = ((page || 1) - 1) * +max;
            const posts = filteredPosts?.slice(start, start + +max);
            const currentPage = Math.floor(start / +max + 1);
            const totalPages = Math.ceil(filteredPosts?.length / +max);
            const olderPage = Math.max(page - 1, 1);
            const newerPage = Math.min(page + 1, totalPages);
            const totalPosts = filteredPosts?.length;
        
            dato[typ] = { totalPosts, olderPage, newerPage, label, currentPage, totalPages };

            let html = '';
            posts?.forEach((entry) => {
                html += cont
                    .replace(/(\w+)\.url/g, (_, p) => `${p}/${temp(entry).url}`)
                    .replace(/a class="([^"]*)"/, (_, p1) => {
                        return `a class="${p1} labl--${temp(entry).color.replace(/ /g, '-')}"`;
                    })
                    .replace(/<new-post:"(\w+)">/g, (_, o) => [o] || "")
                    .replace(/<new-post\.(\w+)(?:\.(.+))?>/g, (_, prop, param) => {
                        const text = String(temp(entry, param)?.[prop] || '').trim();
                        return searchTerm && text
                            ? text.replace(new RegExp(`^${searchTerm}`, 'i'), '<b>$&</b>')
                            : text;
                    });
            });
            return html; 
        };
        return processLoop(content, envio, handleContent);
    };

    const detailHandler = (content, envio) => {
        const handleContent = (cont, feed, type) => {
            return cont
                .replace(/<new-detl\.\.(\w+)>/g, (_, o) => [o])
                .replace(/<new-detl\.title>/g, dato[type]?.label || '')
                .replace(/<new-detl\.input>/g, `<input id="filt" placeholder="Búsqueda"/>`)
                .replace(/<new-detl\.total>/g, `Explore ${dato[type]?.totalPosts || 0}`);
        };
        return processLoop(content, envio, handleContent);
    };

    const labelHandler = (content, envio) => {
        const handleContent = (cont, feed, type, base) => {
            let html = '';
            let cats = [{ term: 'explorer' }, ...(feed?.category?.filter(l => 
                l.term && !base.noLabl[type]?.includes(l.term)) || [])];            
    
            cats.forEach((e) => {
                const label = e.term.replace(/ /g, '-').toLowerCase();
                const selected = label === base.noLabl[type]?.label ? 'is&ndash;active' : '';

                const totalCount = feed?.entry.filter(entry =>
                    e.term === 'explorer'
                        ? !entry.category?.some(cat => base.noLabl[type]?.includes(cat.term)) 
                        : entry.category?.some(cat => cat.term === e.term)
                ).length;
                
                html += cont
                    .replace(/<new-labl\.name>/g, e.term)
                    .replace(/<new-labl\.count>/g, totalCount)
                    .replace(/(\w+)\.url/g, (_, p) => `${p}/label/${label}`)
                    .replace(/<a class="([^"]*)"/g, (_, p1) =>
                        `<a class="${p1} labl--${label} ${selected}"`);
            });
            return html;
        };
        return processLoop(content, envio, handleContent);
    };

    const pageHandler = (content, envio) => {
        const handleContent = (cont, feed, type) => {
            const [typ = '', , max = 3] = (type || '').split(':');
            const { currentPage, totalPages, olderPage, newerPage, label } = dato[typ] || {};
    
            const enlace = (page, text, isActive) => cont
                .replace(/(\w+)\.url/g, `$1/label/${label}/page=${page}`)
                .replace(/a class="([^"]*)"/, `a class="$1 labl--${label.replace(/ /g, '-')} ${isActive ? 'is–active' : ''}"`)
                .replace(/<new-page\.name>/g, text);
    
            let html = enlace(olderPage, '🡨', olderPage === currentPage);
            const start = Math.max(1, Math.min(currentPage - Math.floor(max / 2), totalPages - max + 1));
    
            for (let i = start; i < start + +max && i <= totalPages; i++) {
                html += enlace(i, i, i === currentPage);
            }
    
            html += enlace(newerPage, '🡪', newerPage === currentPage);
            return html;
        };
        return processLoop(content, envio, handleContent);
    };

    const contentHandler = (content, envio) => {
        const handleContent = (cont, feed, type, base) => {
            const info = temp(feed?.entry?.find(e => 
                e.title?.$t?.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html' === rout('cont')) || {});

            setTimeout(() => setupPayp(info, base), 0);

            htmlt = `
            <div class='mainte-pays' id='cont'>
                <new-loop data='${type}' var='cont'>
                    <a class='mainte-author' to='product.url'>${info.author}</a>
                    <div class='mainte-items'>
                        <div class='mainte-item'>
                            <div class='mainte-image'>${info.image}</div>
                            <a class='mainte-title' to='product.url'>${info.title}</a>
                            <input type="number" class='mainte-quantity' id="enlace-quantity" value="1" min="1"/>
                            <span class='mainte-price' id="enlace-total"></span>
                        </div>
                        <input type="text" class='mainte-name' id="enlace-name" placeholder="name *" />
                        <input type="email" class='mainte-email' id="enlace-email" placeholder="email *" />
                        <input type="text" class='mainte-refer' id="enlace-textarea" placeholder="Referido" />
                        <div class='mainte-paypal' id="enlace-paypal"></div>
                        <div class='mainte-alert' id="enlace-alert"></div>
                    </div>
                </new-loop>
            </div>
            `

            return cont
                .replace(/<new-cont\.back>/g, '<a onclick="history.back()">Go back</a>')
                .replace(/<new-cont\.(\w+)>/g, (_, k) => info[k] || '')
                .replace(/(\w+)\.url/g, (_, p) => `${p}/${info.url}`)
        };
        return processLoop(content, envio, handleContent);
    };

    const emailHandler = (content, envio) => {
        const handleContent = (cont, feed, type, base) => {
            setTimeout(() => setupForm(base), 0);

            return cont
                .replace(/<new-emal:"(\w+)">/g, (_, o) => [o] || '')
                .replace(/<new-emal\.title>/g, `Contact Us`)
                .replace(/<new-emal\.author>/g, `<img src='https://${feed?.author?.[0]?.gd$image?.src || ''}'>`)
                .replace(/<new-emal\.authorName>/g, feed?.author?.[0]?.name?.$t || '')
                .replace(/<new-emal\.back>/g, '<a onclick="history.back()">Go back</a>')
                .replace(/<new-emal\.name>/g, '<input type="text" id="enlace-name" placeholder="name *"/>')
                .replace(/<new-emal\.email>/g, '<input type="email" id="enlace-email" placeholder="email *"/>')
                .replace(/<new-emal\.textarea>/g, '<textarea type="text" id="enlace-textarea" placeholder="message"></textarea>')
                .replace(/<new-emal\.submit>/g, '<input type="submit" value="Enviar" id="enlace-button"/>')
                .replace(/<new-emal\.alert>/g, '<p id="enlace-alert"/>');
        };
        return processLoop(content, envio, handleContent);
    };

    const footHandler = (content, envio) => {
        const handleContent = (cont, feed, {}, {}) => {
            return cont
                .replace(/<new-foot:"(\w+)">/g, (_, o) => [o] || '')
                .replace(/<new-foot\.logo\.text>/g, feed?.title?.$t || '')
                .replace(/<new-foot\.subtitle>/g, feed?.subtitle?.$t || '')
                .replace(/<new-foot\.author>/g, `<img src='https://${feed?.author?.[0]?.gd$image?.src || ''}'>`)
                .replace(/<new-foot\.name>/g, feed?.author?.[0]?.name?.$t || '')
                .replace(/<new-foot\.input>/g, `<input type="text" placeholder="Búsqueda"/>`);
        };
        return processLoop(content, envio, handleContent);
    };

    /*----------------------------------------
    ----- API Pública y Carga Inicial
    ----------------------------------------*/

    let dase = {};

    window.bs = { 
        data: (data) => {
            Promise.all(Object.entries(data).map(([type, url]) => 
                new Promise((resolve, reject) => {
                    window[type] = (json) => {
                        dase[type] = json;
                        resolve();
                        delete window[type];
                    };
                    const script = document.createElement("script");
                    script.src = `https://${url}/feeds/posts/full?alt=json&callback=${type}`;
                    script.onerror = () => reject(`Error: ${type}`);
                    document.head.append(script);
                }))
            ).then(() => (tabs?.(), cargar?.())).catch(console.error);
        },
        noLabl: (data) => dase.noLabl = data,
        pays: ({ baseUrl, style, features, clientId }) => {
            const script = document.createElement("script");
            script.src = `https://www.${baseUrl}/sdk/js?client-id=${clientId}&components=${features}`;
            document.head.append(script);
            dase.pays = { style, features, clientId }; 
        },
        form: ({ formUrl }) => {
            dase.formUrl = `https://${formUrl}`;
        },
        test: (cb) => cb(dase)
    };

    /*----------------------------------------
    Lógica Principal de Renderizado y Eventos
    ----------------------------------------*/

    function cargar() {
        const elements = document.querySelectorAll("[id]");
        const contents = [...elements].map(el => el.innerHTML);
        
        if (!elements.length) {
            console.warn("No se encontraron elementos con ID.");
            return;
        }

        function actualice(ids, handler, limit = Infinity) {
            let count = limit;
            elements.forEach((el, i) => {
                if (ids.includes(el.id)) {
                    if (count-- > 0) {
                        el.innerHTML = handler(contents[i], dase);
                        handleSearch(el);
                        handleLinks(el);
                        handleScroll();
                    } else {
                        el.replaceWith(`Limit..`);
                    }
                }
            });
        } 

        function handleSearch(el) {
            const inputs = el.querySelectorAll('#filt');
            if (inputs.length > 0) {
                inputs.forEach(input => {
                    input.addEventListener("input", e => {
                        history.pushState({}, '', `?q=${e.target.value.toLowerCase()}`);
                        actualice(["post"], postHandler, 1);
                        actualice(["page"], pageHandler, 1);
                    });
                });
            }
        }

        function handleLinks(el) {
            const links = el.querySelectorAll("a[to], a[url]");
            if (links.length > 0) {
                links.forEach(link => {
                    const to = link.getAttribute("to");
                    const url = link.getAttribute("url");
        
                    link.classList.toggle('is-active', to === rout("tab"));
        
                    link.onclick = () => {
                        if (to) {
                            history.pushState(null, '', '/' + to.replace(/^\//, ''));
                            tabs(), cargar();
                        } else if (url) {
                            history.pushState(null, '', '/' + url);
                            url.endsWith('.html') ? (tabs(), cargar()) : reload();
                        }
                    };
                });
            }
        }

        function handleScroll() {
            history.scrollRestoration = 'manual';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        actualice(["galy"], postHandler, 20);

        function reload() {
            actualice(["post"], postHandler, 1);
            actualice(["detl"], detailHandler, 1);
            actualice(["labl"], labelHandler, 1);
            actualice(["page"], pageHandler, 1);
            actualice(["cont"], contentHandler, 1);
        }

        actualice(["head"], headHandler, 1);
        actualice(["emal"], emailHandler, 1);
        actualice(["foot"], footHandler, 1);

        reload()
    } 

    window.onpopstate = function() {
        tabs?.(); cargar();
    };

    window.addEventListener('hashchange', tabs);
    window.addEventListener('DOMContentLoaded', tabs);

})(); // <-- Fin de la IIFE
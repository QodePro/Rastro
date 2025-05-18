// section v1.0.0
// Copyright 2025 OverAI
// Developed by OverAI (tk)
// Licensed under MIT (LICENSE)

(function() {  // <-- Inicio de la IIFE -->
    
    /*----------------------------------------
    ---------- Rutas y Localización 
    ----------------------------------------*/

    const rout = (o) => {
        if (!location) return '';
        const { origin = '', pathname = '', search = '' } = location;
        return ({
            tab: pathname.split('/')[1],
            search: search.split('?q=')[1],
            label: pathname.match(/\/label\/([^\/]*)/i)?.[1],
            cont: pathname.split('/')[2],
            page: pathname.match(/page=(\d+)/i)?.[1],
            rout: pathname,
            url: origin
        })[o] || '';
    }; 

    /*----------------------------------------
    ---- Renderizado de Pestañas/Secciones
    ----------------------------------------*/

    const element = document.getElementById('root');
    const mains = document.querySelectorAll('template[path]');

    let clickCount = 0;
    let lockedTab = null;

    const tabs = () => {
        if (!element) return;
    
        let url = rout("tab") || "/";
        if (lockedTab === url) return;
    
        let html = "";
        let direction = clickCount++ % 2 ? "right" : "left";
    
        for (const main of mains) {
            const path = main.getAttribute("path") || "";
        
            if (path === `(${url})`) {
                html = main.innerHTML;
                break;
            } else if (url === path || path === "main") {
                html += main.innerHTML;
            }
        }
    
        element.innerHTML = html;
        element.className = direction;
        lockedTab = url;
    };    

    /*----------------------------------------
    -- Configuración de Formulario (PayPal)
    ----------------------------------------*/

    const setupForm = (info) => {
        const $ = id => document.getElementById(id);
    
        const nameInput = $('enlace-name');
        const emailInput = $('enlace-email');
        const textareaInput = $('enlace-textarea');
        const buttonInput = $('enlace-button');
        const paypalBtn = $('enlace-paypal');
        const input = $('enlace-quantity');
        const formName = $('ContactForm1_contact-form-name');
        const formEmail = $('ContactForm1_contact-form-email');
        const formTextarea = $('ContactForm1_contact-form-email-message');
        const submitBtn = $('ContactForm1_contact-form-submit');
        const alertidentificador = $('enlace-alert');
        const successMessage = $('ContactForm1_contact-form-success-message');
        const errorMessage = $('ContactForm1_contact-form-error-message');
    
        const validate = () => {
            const value = Number(input?.value) || 1;
            const price = Number(info?.price?.slice(1)) || 0;
            const total = (value * price).toFixed(2);
            const details = info?.title && info?.price 
                ? `shop: ${info.title} 1 x ${value} = ${total}`
                : "";
    
            const name = nameInput?.value?.trim() || '';
            const email = emailInput?.value?.trim() || '';
            const textarea = textareaInput?.value?.trim() || '';
            const block = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const style = name && block.test(email)
                ? 'pointer-events: auto; opacity: 1'
                : 'pointer-events: none; opacity: 0.5';
    
            if (formName) formName.value = name;
            if (formEmail) formEmail.value = email;
            if (formTextarea) formTextarea.value = textarea + "\n" + details;
            if (paypalBtn) paypalBtn.style.cssText = style;
            if (buttonInput) buttonInput.style.cssText = style;
    
            [nameInput, emailInput].forEach((input, i) =>
                input?.classList.toggle('is-active', ![name, block.test(email)][i])
            );
        };
    
        const clearInputs = () => {
            setTimeout(() => {
                const success = successMessage?.textContent?.trim() || '';
                const error = errorMessage?.textContent?.trim() || '';
    
                if (alertBtn) {
                    alertBtn.textContent = success || error || '';
                    alertBtn.className = success || error ? 'is-active' : '';
                }
    
                if (nameInput) nameInput.value = '';
                if (emailInput) emailInput.value = '';
                if (textareaInput) textareaInput.value = '';
                if (formName) formName.value = '';
                if (formEmail) formEmail.value = '';
                if (formTextarea) formTextarea.value = '';
                if (buttonInput) buttonInput.value = 'Enviar';
            }, 2000);
        };
    
        if (buttonInput) {
            buttonInput.addEventListener('click', () => {
                if (buttonInput) buttonInput.value = `Sent...`;
                if (submitBtn) submitBtn.click();
                clearInputs();
            });
        }
    
        [nameInput, emailInput, textareaInput, input].forEach(input =>
            input?.addEventListener('input', validate)
        );
    
        validate();
    };

    /*----------------------------------------
    -- Configuración de Formulario (PayPal)
    ----------------------------------------*/

    const setupPayp = ({ price, title }) => {
        const $ = id => document.getElementById(id);
        const submitBtn = $('ContactForm1_contact-form-submit');
        const total = $('enlace-total');
        const element = $('enlace-paypal');
        const input = $('enlace-quantity');
        const alert = $('enlace-alert');

        const p = +price.replace('$', '');

        const validate = () => {
            const v = +(input?.value || 1);
            if (total) total.textContent = `Total $${(v * p).toFixed(2)}`;
        }
    
        if (input) input.oninput = validate;
        validate();

        if (!element || !window.paypal) return;

        window.paypal.Buttons({
            style: { 
                shape: 'pill', 
                layout: 'vertical', 
                color: 'gold', 
                label: 'paypal' 
            },
            createOrder: function(data, actions) {
                const quantity = +(input?.value || 1);
                const currentTotal = (quantity * p).toFixed(2);

                return actions.order.create({
                    intent: 'CAPTURE',
                    purchase_units: [{
                        name: title,
                        quantity: quantity,
                        amount: {
                            currency_code: 'USD',
                            value: currentTotal,
                        },
                        description: title,
                        category: "PHYSICAL_GOODS",
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    if (submitBtn) submitBtn.click();
                    if (alert) alert.className = `is-active`;                 
                });
            },
            onError: function(err) {
                console.error('Error:', err);              
            }
        }).render(element);
    };

    /*----------------------------------------
    ------- Procesamiento de Shortcodes
    ----------------------------------------*/

    function shortcodes(content) {
        let data = ''; 
        let html = '';

        content.replace(/@([a-zA-Z-]+)([\s\S]*?)@([a-zA-Z-]+)/g, (_, open, inners, close) => {
            let processed = '';
            let cleanInner = inners.replace(/<(?!\/?img\b|\/?div\b)[^>]+>/g, '');

            if (open !== close) return;

            inners.replace(/\w+-(\w+)\((.*?)\)(?:-(\w+)\((.*?)\))?-/g, (_, key, inner, name, numbr) => {
                processed += `
                    ${name === "pay" ? '<a to="pay.url">' : name === "url" ? `<a href="${numbr}" target="_blank">` : ''}
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
        const processContent = (date) => (_, type, {}, cont) => {
            const feed = date[type.split(':')[0]]?.feed;
            return handleContent(cont, feed, type);
        };
        return content
            ?.replace(/^[\s\S]*?(<new-loop[^>]*>[\s\S]*?<\/new-loop>)[\s\S]*$/, "$1")
            ?.replace(/<new-loop data="(.*?)" var="(.*?)">([\s\S]*?)<\/new-loop>/g, processContent(envio)) || '';
    };

    const headHandler = (content, envio, {}) => {
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

    const postHandler = (content, envio, No) => {
        const handleContent = (cont, feed, type) => {
            let [typ = '', category = '', max = ''] = type?.split(':') || [];
                
            const labelSet = (No[typ] || '').toLowerCase().split(':');
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
                        return `a class="${p1} is-${temp(entry).color.replace(/ /g, '-')}"`;
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

    const detailHandler = (content, envio, {}) => {
        const handleContent = (cont, feed, type) => {
            return cont
                .replace(/<new-detl\.\.(\w+)>/g, (_, o) => [o])
                .replace(/<new-detl\.title>/g, dato[type]?.label || '')
                .replace(/<new-detl\.input>/g, `<input id="filt" placeholder="Búsqueda"/>`)
                .replace(/<new-detl\.total>/g, `Explore ${dato[type]?.totalPosts || 0}`);
        };
        return processLoop(content, envio, handleContent);
    };

    const labelHandler = (content, envio, No) => {
        const handleContent = (cont, feed, type) => {
            let html = '';
            let cats = [{ term: 'explorer' }, ...(feed?.category?.filter(l => 
                l.term && !No[type]?.includes(l.term)) || [])];            
    
            cats.forEach((e) => {
                const label = e.term.replace(/ /g, '-').toLowerCase();
                const selected = label === dato[type]?.label ? 'is&ndash;active' : '';

                const totalCount = feed?.entry.filter(entry =>
                    e.term === 'explorer'
                        ? !entry.category?.some(cat => No[type]?.includes(cat.term)) 
                        : entry.category?.some(cat => cat.term === e.term)
                ).length;
                
                html += cont
                    .replace(/<new-labl\.name>/g, e.term)
                    .replace(/<new-labl\.count>/g, totalCount)
                    .replace(/(\w+)\.url/g, (_, p) => `${p}/label/${label}`)
                    .replace(/<a class="([^"]*)"/g, (_, p1) =>
                        `<a class="${p1} is-${label} ${selected}"`);
            });
            return html;
        };
        return processLoop(content, envio, handleContent);
    };

    const pageHandler = (content, envio, {}) => {
        const handleContent = (cont, feed, type) => {
            let [typ = '', _, max = 3] = type?.split(':') || [];
    
            const enlace = (page, num, isActive) =>
                cont.replace(/(\w+)\.url/g, (_, p) => `${p}/label/${dato[typ].label}/page=${page}`)
                .replace(/a class="([^"]*)"/, (_, p1) =>
                    `a class="${p1} is-${dato[typ].label.replace(/ /g, '-')} ${isActive ? 'is&ndash;active' : ''}"`)
                .replace(/<new-page\.name>/g, num);
     
            const current = dato[typ]?.currentPage || 1;
            const total = dato[typ]?.totalPages || 1;
            const olderPage = dato[typ]?.olderPage || 1;
            const newerPage = dato[typ]?.newerPage || 1;
    
            let html = enlace(olderPage, '🡨', olderPage === current);
            const start = Math.max(1, Math.min(current - Math.floor(max / 2), total - max + 1));
    
            for (let i = start; i < start + +max && i <= total; i++) {
                html += enlace(i, i, i === current);
            }
    
            html += enlace(newerPage, '🡪', newerPage === current);
            return html;
        };
        return processLoop(content, envio, handleContent);
    };

    const contentHandler = (content, envio, {}) => {
        const handleContent = (cont, feed, type) => {
            const info = temp(feed?.entry?.find(e => 
                e.title?.$t?.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html' === rout('cont')) || {});

            setTimeout(() => {
                setupPayp(info);
                setupForm(info);
            }, 0);
                
            return cont
                .replace(/<new-cont\.alert>/g, '<p id="enlace-alert"/>')
                .replace(/<new-cont\.pay>/g, '<div id="enlace-paypal"/>')
                .replace(/<new-cont\.price>/g, '<span id="enlace-total"/>')
                .replace(/<new-cont\.name>/g, '<input type="text" id="enlace-name" placeholder="name *" />')
                .replace(/<new-cont\.email>/g, '<input type="email" id="enlace-email" placeholder="email *" />')
                .replace(/<new-cont\.refer>/g, '<input type="text" id="enlace-textarea" placeholder="Referido" />')
                .replace(/<new-cont\.quantity>/g, '<input type="number" id="enlace-quantity" value="1" min="1"/>')
                .replace(/<new-cont\.back>/g, '<a onclick="history.back()">>Go back</a>')
                .replace(/<new-cont\.(\w+)>/g, (_, k) => info[k] || '')
                .replace(/(\w+)\.url/g, (_, p) => `${p}/${info.url}`)
        };
        return processLoop(content, envio, handleContent);
    };

    const emailHandler = (content, envio, {}) => {
        const handleContent = (cont, feed, {}) => {

            setTimeout(() => {
                setupForm({});
            }, 0);

            return cont
                .replace(/<new-emal:"(\w+)">/g, (_, o) => [o] || '')
                .replace(/<new-emal\.title>/g, `Contact Us`)
                .replace(/<new-emal\.author>/g, `<img src='https://${feed?.author?.[0]?.gd$image?.src || ''}'>`)
                .replace(/<new-emal\.authorName>/g, feed?.author?.[0]?.name?.$t || '')
                .replace(/<new-emal\.back>/g, '<a onclick="history.back()">Go back</a>')
                .replace(/<new-emal\.name>/g, '<input type="text" id="enlace-name" placeholder="name *"/>')
                .replace(/<new-emal\.email>/g, '<input type="email" id="enlace-email" placeholder="email *"/>')
                .replace(/<new-emal\.textarea>/g, '<textarea type="text" id="enlace-textarea" placeholder="msj"></textarea>')
                .replace(/<new-emal\.button>/g, '<input type="submit" value="Enviar" id="enlace-button"/>')
                .replace(/<new-emal\.alert>/g, '<p id="enlace-alert"/>');
        };
        return processLoop(content, envio, handleContent);
    };

    const footHandler = (content, envio, {}) => {
        const handleContent = (cont, feed, {}) => {
            return cont
                .replace(/<new-foot:"(\w+)">/g, (_, o) => [o] || '')
                .replace(/<new-foot\.logo\.text>/g, feed?.title?.$t || '')
                .replace(/<new-foot\.subtitle>/g, feed?.subtitle?.$t || '')
                .replace(/<new-foot\.author>/g, `<img src='https://${feed?.author?.[0]?.gd$image?.src || ''}'>`)
                .replace(/<new-foot\.name>/g, feed?.author?.[0]?.name?.$t || '')
                .replace(/<new-foot\.input>/g, `<input placeholder="Búsqueda"/>`);
        };
        return processLoop(content, envio, handleContent);
    };

    /*----------------------------------------
    ----- API Pública y Carga Inicial
    ----------------------------------------*/

    let dase = {};
    let No = {};

    window.bs = { 

        data: (data) => {
            Promise.all(Object.entries(data).map(([type, url]) => 
                new Promise((resolve, reject) => {
                    const cb = `${type.replace(/\W/g, '')}`;
                    const timeout = setTimeout(() => reject(`Timeout: ${type}`), 10000);
        
                    window[cb] = (json) => {
                        clearTimeout(timeout);
                        dase[type] = json;
                        resolve();
                        delete window[cb];
                    };
        
                    const script = document.createElement("script");
                    // Ensure URL starts with https://
                    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
                    script.src = `${cleanUrl}/feeds/posts/full?alt=json&callback=${cb}`;
                    script.onerror = () => reject(`Error: ${type}`);
                    document.head.append(script);
                })
            )).then(() => { tabs?.(); cargar(); })
              .catch(err => console.error(err));
        }, 

        labl: (data) => {
            Object.assign(No, data); 
        },

        pays: ({ options, client_id }) => {
            const script = document.createElement("script");
            script.src = `https://www.paypal.com/sdk/js?client-id=${client_id}&components=${options}`;
            document.head.append(script);
        },

        canva: (() => {
            const canva = document.createElement("canva");
            canva.innerHTML = `<b:section id='Blog'/>`;
            document.body.appendChild(canva);
        })(),
        
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
                        el.innerHTML = handler(contents[i], dase, No);
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
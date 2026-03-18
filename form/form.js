/**
 * AnalisCode - Client Form Wizard
 */

const schema = JSON.parse(document.getElementById('schema-data').textContent);
const token = document.getElementById('wizard').dataset.token;
const steps = schema.steps || [];
let currentStep = 0;
let formData = {};

// Step ID → template section mapping
const STEP_TO_SECTION = {
    negocio: '#inicio',
    fotos: '#inicio',
    sobre: '#sobre',
    servicos: '#servicos',
    depoimentos: '#depoimentos',
    faq: '#faq',
    contato: '#contato',
    redes: '#contato',
    preferencias: null,
};

const previewIframe = document.getElementById('preview-iframe');

// Load draft from localStorage
const draft = localStorage.getItem('form_draft_' + token);
if (draft) {
    try { formData = JSON.parse(draft); } catch(e) {}
}

// Auto-save every 30s
setInterval(() => {
    collectCurrentStepData();
    localStorage.setItem('form_draft_' + token, JSON.stringify(formData));
}, 30000);

// Init
renderAllSteps();
showStep(0);

function renderAllSteps() {
    const container = document.getElementById('steps-container');
    container.innerHTML = '';

    steps.forEach((step, i) => {
        const div = document.createElement('div');
        div.className = 'step';
        div.id = 'step-' + i;
        div.dataset.stepId = step.id;

        const section = STEP_TO_SECTION[step.id];
        const badge = section ? `<span class="step__section-badge">Etapa ${i + 1}/${steps.length}</span>` : '';

        div.innerHTML = `
            ${badge}
            <h2 class="step__title">${step.title}</h2>
            <p class="step__desc">${step.description}</p>
            <div class="step__fields" id="fields-${i}"></div>
        `;
        container.appendChild(div);
        renderFields(step.fields, document.getElementById('fields-' + i), '', step.id);
    });
}

function renderFields(fields, container, prefix, stepId) {
    fields.forEach(field => {
        const key = field.key;
        const value = getNestedValue(formData, key) || '';
        const div = document.createElement('div');
        div.className = 'field';
        div.id = 'field-wrap-' + key.replace(/\./g, '-');

        // Add hover highlighting
        const section = STEP_TO_SECTION[stepId];
        if (section && previewIframe) {
            div.addEventListener('mouseenter', () => {
                div.classList.add('field--highlight');
                previewIframe.contentWindow.postMessage({ action: 'highlight', section }, '*');
            });
            div.addEventListener('mouseleave', () => {
                div.classList.remove('field--highlight');
                previewIframe.contentWindow.postMessage({ action: 'unhighlight' }, '*');
            });
        }

        const reqMark = field.required ? '<span class="required">*</span>' : '';
        const hint = field.hint ? `<p class="field__hint">${field.hint}</p>` : '';

        switch (field.type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'url':
            case 'number':
                div.innerHTML = `
                    <label class="field__label">${field.label}${reqMark}</label>
                    <input class="field__input" type="${field.type === 'number' ? 'number' : 'text'}"
                           data-key="${key}" data-type="${field.type}"
                           placeholder="${field.placeholder || ''}"
                           value="${escapeHtml(String(value))}"
                           ${field.maxLength ? 'maxlength="' + field.maxLength + '"' : ''}>
                    ${hint}
                    <p class="field__error-msg">Este campo e obrigatorio</p>
                `;
                break;

            case 'textarea':
                div.innerHTML = `
                    <label class="field__label">${field.label}${reqMark}</label>
                    <textarea class="field__textarea" data-key="${key}" data-type="textarea"
                              placeholder="${field.placeholder || ''}"
                              ${field.maxLength ? 'maxlength="' + field.maxLength + '"' : ''}>${escapeHtml(String(value))}</textarea>
                    ${field.maxLength ? `<p class="field__char-count"><span class="char-current">${String(value).length}</span>/${field.maxLength}</p>` : ''}
                    ${hint}
                    <p class="field__error-msg">Este campo e obrigatorio</p>
                `;
                break;

            case 'image':
                const existingUrl = value ? value : '';
                div.innerHTML = `
                    <label class="field__label">${field.label}${reqMark}</label>
                    <div class="upload-zone ${existingUrl ? 'has-file' : ''}" data-key="${key}" data-type="image"
                         onclick="triggerUpload(this)" ondragover="event.preventDefault(); this.classList.add('dragover')"
                         ondragleave="this.classList.remove('dragover')"
                         ondrop="event.preventDefault(); this.classList.remove('dragover'); handleDrop(event, this)">
                        ${existingUrl
                            ? `<img src="${existingUrl}" class="upload-zone__preview"><br><button class="upload-zone__remove" onclick="event.stopPropagation(); removeUpload(this)">Remover</button>`
                            : `<div class="upload-zone__icon">&#128247;</div><p class="upload-zone__text">Clique ou arraste uma <strong>imagem</strong> aqui</p>`
                        }
                    </div>
                    <input type="file" accept="image/*" style="display:none" onchange="handleFileSelect(this)">
                    ${hint}
                    <p class="field__error-msg">Este campo e obrigatorio</p>
                `;
                break;

            case 'list':
                const items = getNestedValue(formData, key) || [];
                const suggestConfig = field.suggest || null;
                const hasSuggest = !!suggestConfig;
                const suggestActive = getNestedValue(formData, key + '_suggest') === true;

                div.innerHTML = `
                    <label class="field__label">${field.label}${reqMark}</label>
                    ${hasSuggest ? `
                    <button class="btn-suggest-ai ${suggestActive ? 'active' : ''}" onclick="toggleSuggestMode(this, '${key}')" data-key="${key}_suggest">
                        <svg class="btn-suggest-ai__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5v1h-4v-1C8.8 8.8 8 7.5 8 6a4 4 0 0 1 4-4z"/><path d="M10 10.5v2.5"/><path d="M14 10.5v2.5"/><rect x="9" y="13" width="6" height="3" rx="1"/><path d="M10 16v1a2 2 0 0 0 4 0v-1"/><path d="M4 8h2"/><path d="M18 8h2"/><path d="M5.5 3.5l1.5 1.5"/><path d="M17 5l1.5-1.5"/></svg>
                        <span>${suggestConfig.label}</span>
                    </button>
                    ` : ''}
                    <div class="suggest-info-banner" data-suggest-for="${key}" style="display:${suggestActive ? 'block' : 'none'}; margin-bottom:12px;">
                        <div class="info-banner info-banner--blue">
                            <span class="info-banner__icon">&#9432;</span>
                            <span>${hasSuggest ? suggestConfig.info_text : ''}</span>
                        </div>
                    </div>
                    <div class="list-field" data-key="${key}" data-type="list"
                         data-min="${field.minItems || 0}" data-max="${field.maxItems || 10}"
                         style="display:${suggestActive ? 'none' : 'block'};">
                        <div class="list-field__items" id="list-${key.replace(/\./g, '-')}"></div>
                        <button class="list-field__add" onclick="addListItem(this.parentElement)">+ Adicionar</button>
                    </div>
                `;
                container.appendChild(div);

                const listContainer = document.getElementById('list-' + key.replace(/\./g, '-'));
                if (items.length > 0) {
                    items.forEach((item, idx) => addListItemWithData(div.querySelector('.list-field'), item, idx));
                } else {
                    // Add minimum items
                    const min = field.minItems || 1;
                    for (let i = 0; i < min; i++) {
                        addListItem(div.querySelector('.list-field'));
                    }
                }
                return; // already appended

            case 'toggle':
                const toggleVal = value === true || value === 'true' || value === 1;
                const onField = field.on_field || null;
                const offText = field.off_text || '';
                const onFieldValue = onField ? (getNestedValue(formData, onField.key) || '') : '';

                div.innerHTML = `
                    <div class="toggle-field" data-key="${key}" data-type="toggle">
                        <div class="toggle-header">
                            <span class="toggle-label">${field.label}</span>
                            <label class="toggle-switch">
                                <input type="checkbox" class="toggle-input" data-key="${key}" ${toggleVal ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <div class="toggle-content">
                            ${toggleVal && onField
                                ? `<div class="toggle-on-content field" style="margin-top:12px">
                                    <label class="field__label">${onField.label}</label>
                                    <input class="field__input" type="text" data-key="${onField.key}" data-type="${onField.type || 'text'}" placeholder="${onField.placeholder || ''}" value="${escapeHtml(String(onFieldValue))}">
                                  </div>`
                                : !toggleVal && offText
                                    ? `<div class="toggle-off-content" style="margin-top:12px">
                                        <div class="info-banner info-banner--blue">
                                            <span class="info-banner__icon">&#9432;</span>
                                            <span>${offText}</span>
                                        </div>
                                      </div>`
                                    : ''
                            }
                        </div>
                    </div>
                `;

                // Add toggle change listener after appending
                container.appendChild(div);
                const toggleInput = div.querySelector('.toggle-input');
                if (toggleInput) {
                    toggleInput.addEventListener('change', function() {
                        const isOn = this.checked;
                        setNestedValue(formData, key, isOn);
                        const contentDiv = div.querySelector('.toggle-content');
                        if (isOn && onField) {
                            contentDiv.innerHTML = `
                                <div class="toggle-on-content field" style="margin-top:12px">
                                    <label class="field__label">${onField.label}</label>
                                    <input class="field__input" type="text" data-key="${onField.key}" data-type="${onField.type || 'text'}" placeholder="${onField.placeholder || ''}" value="${escapeHtml(String(getNestedValue(formData, onField.key) || ''))}">
                                </div>
                            `;
                        } else if (!isOn && offText) {
                            contentDiv.innerHTML = `
                                <div class="toggle-off-content" style="margin-top:12px">
                                    <div class="info-banner info-banner--blue">
                                        <span class="info-banner__icon">&#9432;</span>
                                        <span>${offText}</span>
                                    </div>
                                </div>
                            `;
                        } else {
                            contentDiv.innerHTML = '';
                        }
                    });
                }
                return; // already appended

            case 'color-choice':
                const options = field.options || [];
                const selectedColor = value || '';
                div.innerHTML = `
                    <label class="field__label">${field.label}</label>
                    <div class="color-choices" data-key="${key}" data-type="color-choice">
                        ${options.map(opt => `<button class="color-choice ${selectedColor === opt ? 'selected' : ''}" onclick="selectChoice(this)">${opt}</button>`).join('')}
                    </div>
                `;
                break;

            case 'choice':
                const choiceOpts = field.options || [];
                const selectedChoice = value || '';
                div.innerHTML = `
                    <label class="field__label">${field.label}</label>
                    <div class="choice-cards" data-key="${key}" data-type="choice">
                        ${choiceOpts.map(opt => `<button class="choice-card ${selectedChoice === opt ? 'selected' : ''}" onclick="selectChoice(this)">${opt}</button>`).join('')}
                    </div>
                `;
                break;

            default:
                return;
        }

        // Handle conditional fields
        if (field.conditional) {
            div.style.display = 'none';
            div.dataset.conditional = field.conditional;
        }

        container.appendChild(div);
    });

    // Setup textarea char counters
    container.querySelectorAll('.field__textarea[maxlength]').forEach(ta => {
        ta.addEventListener('input', () => {
            const counter = ta.parentElement.querySelector('.char-current');
            if (counter) counter.textContent = ta.value.length;
        });
    });
}

function showStep(index) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    const step = document.getElementById('step-' + index);
    if (step) step.classList.add('active');

    currentStep = index;

    // Update progress
    const pct = ((index + 1) / steps.length) * 100;
    document.getElementById('progress-bar').style.width = pct + '%';
    document.getElementById('step-label').textContent = `Etapa ${index + 1} de ${steps.length}`;

    // Update buttons
    document.getElementById('btn-prev').disabled = index === 0;
    const btnNext = document.getElementById('btn-next');
    if (index === steps.length - 1) {
        btnNext.innerHTML = 'Enviar &#10003;';
    } else {
        btnNext.innerHTML = 'Proximo &rarr;';
    }

    // Check conditionals
    checkConditionals();

    // Scroll preview iframe to corresponding section
    const stepId = steps[index]?.id;
    const section = STEP_TO_SECTION[stepId];
    if (previewIframe && section) {
        previewIframe.contentWindow.postMessage({ action: 'scrollTo', section }, '*');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep() {
    collectCurrentStepData();

    // Validate required
    if (!validateStep(currentStep)) return;

    if (currentStep === steps.length - 1) {
        submitForm();
    } else {
        showStep(currentStep + 1);
    }
}

function prevStep() {
    collectCurrentStepData();
    if (currentStep > 0) showStep(currentStep - 1);
}

function validateStep(index) {
    const step = steps[index];
    let valid = true;

    step.fields.forEach(field => {
        if (!field.required) return;
        const wrap = document.getElementById('field-wrap-' + field.key.replace(/\./g, '-'));
        if (!wrap) return;

        // Skip hidden conditional fields
        if (wrap.style.display === 'none') return;

        const value = getNestedValue(formData, field.key);
        const isEmpty = !value || (typeof value === 'string' && value.trim() === '');

        if (isEmpty) {
            wrap.classList.add('field--error');
            valid = false;
        } else {
            wrap.classList.remove('field--error');
        }
    });

    return valid;
}

function collectCurrentStepData() {
    const stepEl = document.getElementById('step-' + currentStep);
    if (!stepEl) return;

    // Text/number/email/tel/url inputs
    stepEl.querySelectorAll('.field__input, .field__textarea').forEach(input => {
        const key = input.dataset.key;
        if (key) {
            let val = input.value;
            if (input.dataset.type === 'number' && val) val = parseInt(val);
            setNestedValue(formData, key, val);
        }
    });

    // Toggle fields
    stepEl.querySelectorAll('[data-type="toggle"]').forEach(toggleField => {
        const key = toggleField.dataset.key;
        const checkbox = toggleField.querySelector('.toggle-input');
        if (checkbox) {
            setNestedValue(formData, key, checkbox.checked);
        }
    });

    // Color/choice selections
    stepEl.querySelectorAll('[data-type="color-choice"], [data-type="choice"]').forEach(group => {
        const key = group.dataset.key;
        const selected = group.querySelector('.selected');
        setNestedValue(formData, key, selected ? selected.textContent : '');
    });

    // Lists
    stepEl.querySelectorAll('[data-type="list"]').forEach(listField => {
        const key = listField.dataset.key;
        const items = [];
        listField.querySelectorAll('.list-item').forEach(item => {
            const obj = {};
            item.querySelectorAll('.field__input, .field__textarea').forEach(input => {
                const subKey = input.dataset.subkey;
                if (subKey) obj[subKey] = input.value;
            });
            if (Object.values(obj).some(v => v)) items.push(obj);
        });
        setNestedValue(formData, key, items);
    });

    // Save draft
    localStorage.setItem('form_draft_' + token, JSON.stringify(formData));
}

async function submitForm() {
    collectCurrentStepData();

    const btnNext = document.getElementById('btn-next');
    btnNext.disabled = true;
    btnNext.textContent = 'Enviando...';

    try {
        const res = await fetch('/api/submit.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, data: formData })
        });

        const result = await res.json();

        if (result.success) {
            localStorage.removeItem('form_draft_' + token);
            document.getElementById('wizard').style.display = 'none';
            document.getElementById('success-screen').style.display = 'flex';
        } else {
            alert('Erro ao enviar: ' + (result.error || 'Tente novamente.'));
            btnNext.disabled = false;
            btnNext.innerHTML = 'Enviar &#10003;';
        }
    } catch (e) {
        alert('Erro de conexao. Tente novamente.');
        btnNext.disabled = false;
        btnNext.innerHTML = 'Enviar &#10003;';
    }
}

// Image upload helpers
function triggerUpload(zone) {
    const fileInput = zone.parentElement.querySelector('input[type="file"]');
    fileInput.click();
}

async function handleFileSelect(input) {
    const file = input.files[0];
    if (!file) return;
    const zone = input.previousElementSibling;
    await uploadFile(zone, file);
}

function handleDrop(e, zone) {
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        uploadFile(zone, file);
    }
}

async function uploadFile(zone, file) {
    const key = zone.dataset.key;

    // Show loading
    zone.innerHTML = '<p class="upload-zone__text">Enviando...</p>';

    const fd = new FormData();
    fd.append('token', token);
    fd.append('field_key', key);
    fd.append('file', file);

    try {
        const res = await fetch('/api/upload.php', { method: 'POST', body: fd });
        const result = await res.json();

        if (result.success) {
            setNestedValue(formData, key, result.url);
            zone.classList.add('has-file');
            zone.innerHTML = `
                <img src="${result.url}" class="upload-zone__preview">
                <br><button class="upload-zone__remove" onclick="event.stopPropagation(); removeUpload(this)">Remover</button>
            `;
        } else {
            zone.innerHTML = `<div class="upload-zone__icon">&#128247;</div><p class="upload-zone__text" style="color:var(--danger)">${result.error || 'Erro no upload'}</p>`;
            zone.classList.remove('has-file');
        }
    } catch (e) {
        zone.innerHTML = '<div class="upload-zone__icon">&#128247;</div><p class="upload-zone__text" style="color:var(--danger)">Erro de conexao</p>';
        zone.classList.remove('has-file');
    }
}

function removeUpload(btn) {
    const zone = btn.closest('.upload-zone');
    const key = zone.dataset.key;
    setNestedValue(formData, key, '');
    zone.classList.remove('has-file');
    zone.innerHTML = `<div class="upload-zone__icon">&#128247;</div><p class="upload-zone__text">Clique ou arraste uma <strong>imagem</strong> aqui</p>`;
}

// List helpers
function addListItem(listField, data) {
    const key = listField.dataset.key;
    const max = parseInt(listField.dataset.max) || 10;
    const itemsContainer = listField.querySelector('.list-field__items');
    const count = itemsContainer.querySelectorAll('.list-item').length;

    if (count >= max) return;

    // Find the field schema
    const step = steps[currentStep];
    const fieldSchema = step.fields.find(f => f.key === key);
    if (!fieldSchema || !fieldSchema.itemFields) return;

    const idx = count + 1;
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
        <div class="list-item__header">
            <span class="list-item__number">#${idx}</span>
            <button class="list-item__remove" onclick="removeListItem(this)">&times;</button>
        </div>
        ${fieldSchema.itemFields.map(f => `
            <div class="field" style="margin-bottom:12px">
                <label class="field__label">${f.label}${f.required ? '<span class="required">*</span>' : ''}</label>
                ${f.type === 'textarea'
                    ? `<textarea class="field__textarea" data-subkey="${f.key}" placeholder="${f.placeholder || ''}" ${f.maxLength ? 'maxlength="' + f.maxLength + '"' : ''}>${data && data[f.key] ? escapeHtml(data[f.key]) : ''}</textarea>`
                    : `<input class="field__input" type="text" data-subkey="${f.key}" placeholder="${f.placeholder || ''}" value="${data && data[f.key] ? escapeHtml(data[f.key]) : ''}" ${f.maxLength ? 'maxlength="' + f.maxLength + '"' : ''}>`
                }
            </div>
        `).join('')}
    `;

    itemsContainer.appendChild(item);

    // Hide add button if at max
    if (itemsContainer.querySelectorAll('.list-item').length >= max) {
        listField.querySelector('.list-field__add').style.display = 'none';
    }
}

function addListItemWithData(listField, data, idx) {
    addListItem(listField, data);
}

function removeListItem(btn) {
    const item = btn.closest('.list-item');
    const listField = item.closest('.list-field');
    const min = parseInt(listField.dataset.min) || 0;
    const itemsContainer = listField.querySelector('.list-field__items');

    if (itemsContainer.querySelectorAll('.list-item').length <= min) return;

    item.remove();

    // Re-number items
    itemsContainer.querySelectorAll('.list-item').forEach((item, i) => {
        item.querySelector('.list-item__number').textContent = '#' + (i + 1);
    });

    // Show add button
    listField.querySelector('.list-field__add').style.display = '';
}

// Suggest mode toggle
function toggleSuggestMode(btn, listKey) {
    const isActive = btn.classList.toggle('active');
    const parent = btn.closest('.field');
    const banner = parent.querySelector('.suggest-info-banner');
    const listField = parent.querySelector('.list-field');

    if (isActive) {
        banner.style.display = 'block';
        listField.style.display = 'none';
        setNestedValue(formData, listKey + '_suggest', true);
    } else {
        banner.style.display = 'none';
        listField.style.display = 'block';
        setNestedValue(formData, listKey + '_suggest', false);
    }
    localStorage.setItem('form_draft_' + token, JSON.stringify(formData));
}

// Choice helpers
function selectChoice(btn) {
    btn.parentElement.querySelectorAll('.selected').forEach(s => s.classList.remove('selected'));
    btn.classList.add('selected');
    checkConditionals();
}

function checkConditionals() {
    document.querySelectorAll('[data-conditional]').forEach(el => {
        const cond = el.dataset.conditional;
        const [condKey, condVal] = cond.split('=');
        const currentVal = getNestedValue(formData, condKey);

        // Also check currently selected in DOM
        const parent = document.querySelector(`[data-key="${condKey}"]`);
        let domVal = '';
        if (parent) {
            const selected = parent.querySelector('.selected');
            if (selected) domVal = selected.textContent;
        }

        el.style.display = (currentVal === condVal || domVal === condVal) ? '' : 'none';
    });
}

// Utility functions
function getNestedValue(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : '', obj);
}

function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
            current[keys[i]] = {};
        }
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

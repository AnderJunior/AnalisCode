const fs = require('fs');
const path = require('path');
const config = require('../config');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getNestedValue(obj, keyPath) {
  const keys = keyPath.split('.');
  let value = obj;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  return value;
}

function renderTemplate(templateSlug, data) {
  const templatePath = path.join(config.paths.templates, templateSlug, 'template.html');

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateSlug}`);
  }

  let html = fs.readFileSync(templatePath, 'utf8');

  // Inject custom CSS variables (colors)
  if (data.colors && typeof data.colors === 'object') {
    let cssVars = ':root {\n';
    for (const [key, value] of Object.entries(data.colors)) {
      const safeName = key.replace(/_/g, '-').replace(/[^a-z0-9-]/gi, '');
      const safeValue = escapeHtml(value);
      cssVars += `  --color-${safeName}: ${safeValue};\n`;
    }
    cssVars += '}\n';
    html = html.replace('</head>', `<style>${cssVars}</style>\n</head>`);
  }

  // Process {{#each}} blocks
  html = html.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, key, block) => {
    const items = data[key] || [];
    let output = '';
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      let rendered = block;
      // Replace {{@index}}
      rendered = rendered.replace(/\{\{@index\}\}/g, String(index));
      // Replace {{field}} within item
      if (item && typeof item === 'object') {
        for (const [field, value] of Object.entries(item)) {
          const safeValue = escapeHtml(String(value));
          rendered = rendered.split(`{{${field}}}`).join(safeValue);
        }
      }
      output += rendered;
    }
    return output;
  });

  // Replace simple {{key.subkey}} placeholders
  html = html.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (match, keyPath) => {
    const value = getNestedValue(data, keyPath);
    if (value !== undefined && (typeof value === 'string' || typeof value === 'number')) {
      return escapeHtml(String(value));
    }
    return match; // Keep original if not found
  });

  return html;
}

function loadSchema(templateSlug) {
  const schemaPath = path.join(config.paths.templates, templateSlug, 'schema.json');
  if (!fs.existsSync(schemaPath)) return [];
  return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
}

function loadDefaultData(templateSlug) {
  const dataPath = path.join(config.paths.templates, templateSlug, 'default_data.json');
  if (!fs.existsSync(dataPath)) return {};
  return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

module.exports = { renderTemplate, loadSchema, loadDefaultData };

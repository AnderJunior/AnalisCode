<?php
/**
 * AnalisCode - Template Renderer
 * Replaces {{placeholders}} in templates with client data.
 */

function renderTemplate(string $templateSlug, array $data): string {
    $templatePath = TEMPLATES_PATH . '/' . $templateSlug . '/template.html';

    if (!file_exists($templatePath)) {
        throw new RuntimeException("Template not found: $templateSlug");
    }

    $html = file_get_contents($templatePath);

    // Inject custom CSS variables (colors)
    if (!empty($data['colors'])) {
        $cssVars = ":root {\n";
        foreach ($data['colors'] as $key => $value) {
            $safeName = preg_replace('/[^a-z0-9-]/', '', str_replace('_', '-', $key));
            $safeValue = htmlspecialchars($value, ENT_QUOTES);
            $cssVars .= "  --color-{$safeName}: {$safeValue};\n";
        }
        $cssVars .= "}\n";
        $html = str_replace('</head>', "<style>{$cssVars}</style>\n</head>", $html);
    }

    // Process {{#each}} blocks
    $html = preg_replace_callback(
        '/\{\{#each\s+(\w+)\}\}(.*?)\{\{\/each\}\}/s',
        function ($matches) use ($data) {
            $key = $matches[1];
            $block = $matches[2];
            $items = $data[$key] ?? [];
            $output = '';

            foreach ($items as $index => $item) {
                $rendered = $block;
                // Replace {{@index}}
                $rendered = str_replace('{{@index}}', (string)$index, $rendered);
                // Replace {{field}} within item
                if (is_array($item)) {
                    foreach ($item as $field => $value) {
                        $safeValue = htmlspecialchars((string)$value, ENT_QUOTES);
                        $rendered = str_replace('{{' . $field . '}}', $safeValue, $rendered);
                    }
                }
                $output .= $rendered;
            }
            return $output;
        },
        $html
    );

    // Replace simple {{key.subkey}} placeholders
    $html = preg_replace_callback(
        '/\{\{([a-zA-Z0-9_.]+)\}\}/',
        function ($matches) use ($data) {
            $keys = explode('.', $matches[1]);
            $value = $data;
            foreach ($keys as $k) {
                if (is_array($value) && isset($value[$k])) {
                    $value = $value[$k];
                } else {
                    return $matches[0]; // Keep original if not found
                }
            }
            if (is_string($value) || is_numeric($value)) {
                return htmlspecialchars((string)$value, ENT_QUOTES);
            }
            return $matches[0];
        },
        $html
    );

    return $html;
}

/**
 * Load schema for a template
 */
function loadSchema(string $templateSlug): array {
    $schemaPath = TEMPLATES_PATH . '/' . $templateSlug . '/schema.json';
    if (!file_exists($schemaPath)) {
        return [];
    }
    return json_decode(file_get_contents($schemaPath), true) ?? [];
}

/**
 * Load default data for a template
 */
function loadDefaultData(string $templateSlug): array {
    $dataPath = TEMPLATES_PATH . '/' . $templateSlug . '/default_data.json';
    if (!file_exists($dataPath)) {
        return [];
    }
    return json_decode(file_get_contents($dataPath), true) ?? [];
}

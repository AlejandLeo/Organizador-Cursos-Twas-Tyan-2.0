const fs = require('fs');
const path = require('path');

// Void elements in HTML that do not require closing tags
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

function verifyTags(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`El archivo no existe: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Extract <template> block if it is a Vue file
  let templateContent = '';
  let inTemplate = false;
  let templateStartLine = 0;
  
  if (filePath.endsWith('.vue')) {
    let openTemplates = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for opening template tag
      if (/<template\b[^>]*>/.test(line)) {
        if (openTemplates === 0) {
          inTemplate = true;
          templateStartLine = i + 1;
        }
        openTemplates++;
        if (openTemplates > 1) {
          templateContent += line + '\n';
        }
        continue;
      }
      
      // Look for closing template tag
      if (/<\/template>/.test(line)) {
        openTemplates--;
        if (openTemplates === 0) {
          inTemplate = false;
        } else {
          templateContent += line + '\n';
        }
        continue;
      }
      
      if (inTemplate) {
        templateContent += line + '\n';
      }
    }
  } else {
    templateContent = content;
  }

  if (filePath.endsWith('.vue') && !templateContent) {
    console.log(`[OK] No se encontró sección <template> o está vacía en: ${path.basename(filePath)}`);
    return;
  }

  // Clean comments from template content to avoid false matches
  // Replace HTML comments <!-- ... --> with spaces (preserving line count)
  templateContent = templateContent.replace(/<!--[\s\S]*?-->/g, match => {
    return match.replace(/[^\n]/g, ' ');
  });

  const tagRegex = /<(\/?)([a-zA-Z0-9:-]+)([^>]*?)>/g;
  const stack = [];
  const errors = [];
  
  // We need to keep track of line numbers.
  // We will find all matches and compute their line numbers based on index.
  let match;
  while ((match = tagRegex.exec(templateContent)) !== null) {
    const fullTag = match[0];
    const isClosing = match[1] === '/';
    const tagName = match[2].toLowerCase();
    const attributes = match[3];
    
    // Check if it's self-closing (ends with />) or is a void element
    const isSelfClosing = attributes.trim().endsWith('/') || VOID_ELEMENTS.has(tagName);
    
    if (isSelfClosing && !isClosing) {
      continue;
    }

    // Compute line number in original file
    const index = match.index;
    const linesBefore = templateContent.substring(0, index).split('\n');
    const lineNumber = (filePath.endsWith('.vue') ? templateStartLine : 1) + linesBefore.length - 1;

    if (!isClosing) {
      // Opening tag
      stack.push({ name: tagName, line: lineNumber, tag: fullTag });
    } else {
      // Closing tag
      if (stack.length === 0) {
        errors.push({
          type: 'extra_closing',
          tag: tagName,
          line: lineNumber,
          msg: `Etiqueta de cierre </${tagName}> sin etiqueta de apertura correspondiente en línea ${lineNumber}`
        });
      } else {
        const last = stack.pop();
        if (last.name !== tagName) {
          errors.push({
            type: 'mismatch',
            expected: last.name,
            got: tagName,
            openedLine: last.line,
            closedLine: lineNumber,
            msg: `Se esperaba cerrar <${last.name}> (abierta en línea ${last.line}), pero se cerró con </${tagName}> en línea ${lineNumber}`
          });
          // Put the mismatched tag back on stack to keep validating outer structures
          stack.push(last);
        }
      }
    }
  }

  // Remaining open tags in stack
  while (stack.length > 0) {
    const openTag = stack.pop();
    errors.push({
      type: 'unclosed',
      tag: openTag.name,
      line: openTag.line,
      msg: `Etiqueta <${openTag.name}> abierta en línea ${openTag.line} nunca fue cerrada`
    });
  }

  const filename = path.basename(filePath);
  if (errors.length === 0) {
    console.log(`\x1b[32m[OK] ${filename} - Estructura HTML perfecta.\x1b[0m`);
  } else {
    console.log(`\n\x1b[31m[ERROR] ${filename} tiene ${errors.length} error(es) de estructura:\x1b[0m`);
    errors.forEach((err, idx) => {
      console.log(`  ${idx + 1}. \x1b[33m[Línea ${err.line}]\x1b[0m ${err.msg}`);
    });
  }
}

// Run verify tags on files provided as arguments
const files = process.argv.slice(2);
if (files.length === 0) {
  console.log('Uso: node verify_tags.js <archivo1.vue> <archivo2.html> ...');
} else {
  files.forEach(verifyTags);
}

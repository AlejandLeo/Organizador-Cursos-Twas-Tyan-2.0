const fs = require('fs');
const path = require('path');

const frontendFiles = [
  'add_div.cjs', 'api_test.cjs', 'check_templates.cjs', 'clean_template.cjs',
  'delete_extra.cjs', 'dummy-injector.cjs', 'error_block.txt', 'final-fix.cjs',
  'fix-det.cjs', 'fix-ponentes-type.cjs', 'fix-ponents.cjs', 'fix-tabs.cjs',
  'fix.ps1', 'fix_again.cjs', 'fix_close.cjs', 'fix_final.cjs', 'fix_logic.cjs',
  'fix_script.cjs', 'fix_script.sh', 'fix_tabs_roles.cjs', 'fix_tabs_roles2.cjs',
  'fix_tabs_roles3.cjs', 'fix_type.cjs', 'fix_type2.cjs', 'fix_type3.cjs',
  'force-ponente.cjs', 'force_fix.cjs', 'force_fix2.cjs', 'get_offset.cjs',
  'index.cjs', 'manual_fix.cjs', 'original_mock.vue', 'parse_debug.cjs',
  'parse_debug2.cjs', 'parse_lines.cjs', 'patch_unimplemented.cjs',
  'pop_all_divs.cjs', 'pop_div.cjs', 'print_ast.cjs', 'print_ast_fixed.cjs',
  'replace.cjs', 'rewrite_block.cjs', 'run_fix.cjs', 'safe_replace.cjs',
  'seed-event-update.cjs', 'temp.txt', 'template_catalogo.cjs',
  'template_dashboard.cjs', 'template_script.js', 'template_update.cjs',
  'test.js', 'test_parse.cjs', 'update_tabs.cjs', 'test.txt'
];

const backendFiles = [
  'add_modal.js', 'check_keys.ts', 'fix_vue_bug.cjs', 'template_update.js',
  'update_script.js', 'verify_db.ts'
];

console.log('--- Cleaning Frontend ---');
frontendFiles.forEach(file => {
  const fullPath = path.join(__dirname, 'frontend', file);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`Deleted: ${file}`);
    } catch (err) {
      console.error(`Error deleting ${file}: ${err.message}`);
    }
  }
});

console.log('\n--- Cleaning Backend ---');
backendFiles.forEach(file => {
  const fullPath = path.join(__dirname, 'backend', file);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`Deleted: ${file}`);
    } catch (err) {
      console.error(`Error deleting ${file}: ${err.message}`);
    }
  }
});

console.log('\nCleanup finished.');

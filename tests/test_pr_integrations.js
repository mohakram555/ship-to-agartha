import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

const checks = [];

function check(description, condition) {
    checks.push({ description, passed: Boolean(condition) });
}

const main = read('js/main.js');
const renderer = read('js/renderer.js');
const index = read('index.html');
const readme = read('README.md');
const setup = read('SETUP.md');
const vpsSetup = read('deployment/VPS_SETUP.md');

check('damagePlayer ignores damage after level completion', /function damagePlayer\(\)[\s\S]*GameState\.levelComplete/.test(main));
check('unused levelCompleteTimer state is removed', !main.includes('levelCompleteTimer'));
check('formation enemies do not receive duplicate sway movement in updateEntities', !main.includes('Math.sin(e.moveTimer * 1.5) * 20 * dt'));
check('heartPlusOne effect participates in HUD cache invalidation', main.includes('lastHudState.heartPlusOne'));
check('heartPlusOne effect renders an extra HUD heart', main.includes('health-heart extra'));
check('HUD health hearts render through SVG helper', main.includes('function getHeartSVG'));

check('index dialogue continue indicator uses SVG instead of text symbol', /id="dialogue-continue"[\s\S]*<svg/.test(index));
check('index elixir indicators use SVG instead of emoji', !index.includes('🥛') && /id="elixir-icon"[\s\S]*<svg/.test(index));

check('renderer has reusable canvas icon helper', renderer.includes('function drawIcon'));
check('renderer power-up labels no longer depend on emoji glyphs', !/[⚡🛡️🔥❤️🎯✨]/u.test(renderer));
check('collectible marker uses canvas icon drawing', /drawIcon\(ctx, 'heart'/.test(renderer));

check('README references a main menu screenshot', readme.includes('assets/screenshots/main_menu.png'));
check('README references a gameplay screenshot', readme.includes('assets/screenshots/gameplay.png'));
check('README references a boss screenshot', readme.includes('assets/screenshots/level_30_boss.png'));
check('README uses a natural project format instead of a technical report', !readme.includes('Technical Report') && !readme.includes('Technical & Release Report') && readme.includes('## Play Locally') && readme.includes('## Controls'));
check('main menu screenshot exists', fs.existsSync('assets/screenshots/main_menu.png'));
check('gameplay screenshot exists', fs.existsSync('assets/screenshots/gameplay.png'));
check('boss screenshot exists', fs.existsSync('assets/screenshots/level_30_boss.png'));

check('README documents how to open the developer menu', /Developer Menu[\s\S]*mission objective[\s\S]*three times[\s\S]*DEV/.test(readme));
check('SETUP documents how to open the developer menu', /Developer Menu[\s\S]*mission objective[\s\S]*three times[\s\S]*DEV/.test(setup));
check('README links complete deployment guidance', readme.includes('deployment/VPS_SETUP.md') && readme.includes('deployment/github-actions-deploy.example.yml'));
check('SETUP covers static, VPS, and GitHub Actions deployment paths', setup.includes('Static hosting') && setup.includes('VPS hosting') && setup.includes('GitHub Actions'));
check('VPS guide includes deployment verification steps', vpsSetup.includes('Verify Deployment') && vpsSetup.includes('https://<YOUR_DOMAIN>'));

let failed = 0;
for (const result of checks) {
    const prefix = result.passed ? 'PASS' : 'FAIL';
    console.log(`${prefix}: ${result.description}`);
    if (!result.passed) failed++;
}

if (failed > 0) {
    console.error(`\n${failed} PR integration check(s) failed.`);
    process.exit(1);
}

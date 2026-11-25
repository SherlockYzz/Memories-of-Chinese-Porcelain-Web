/**
 * 静态数据源：把 content/ 下的内容文件打进主包。
 * 这是“永远可用”的兜底——没有网络、没有后端时，页面依然能完整展示。
 *
 * 新增内容集合：在 content/ 放一个 JSON，在这里登记一行，并在 content/schemas.mjs 写校验规则。
 */
import vessels from '../../../content/vessels.json';
import glazes from '../../../content/glazes.json';
import history from '../../../content/history.json';
import kilns from '../../../content/kilns.json';
import workshopSteps from '../../../content/workshop-steps.json';
import colors from '../../../content/colors.json';
import literatiArts from '../../../content/literati-arts.json';
import archive from '../../../content/archive.json';
import reignMarks from '../../../content/reign-marks.json';
import notes from '../../../content/notes.json';
import microscope from '../../../content/microscope.json';
import comparison from '../../../content/comparison.json';
import pentatonic from '../../../content/pentatonic.json';
import quiz from '../../../content/quiz.json';
import navigation from '../../../content/navigation.json';
import site from '../../../content/site.json';
import credits from '../../../content/credits.json';
import scene from '../../../content/scene.json';
import crackleLab from '../../../content/crackle-lab.json';
import kintsugi from '../../../content/kintsugi.json';
import firingTimeline from '../../../content/firing-timeline.json';
import passport from '../../../content/passport.json';

export const STATIC_COLLECTIONS = Object.freeze({
    vessels,
    glazes,
    history,
    kilns,
    'workshop-steps': workshopSteps,
    colors,
    'literati-arts': literatiArts,
    archive,
    'reign-marks': reignMarks,
    notes,
    microscope,
    comparison,
    pentatonic,
    quiz,
    navigation,
    site,
    credits,
    scene,
    'crackle-lab': crackleLab,
    kintsugi,
    'firing-timeline': firingTimeline,
    passport
});

export const staticSource = {
    name: 'static',
    has: (collection) => Object.prototype.hasOwnProperty.call(STATIC_COLLECTIONS, collection),
    get: (collection) => STATIC_COLLECTIONS[collection],
    async load(collection) {
        return STATIC_COLLECTIONS[collection];
    }
};

export default staticSource;

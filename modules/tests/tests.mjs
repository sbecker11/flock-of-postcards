// modules/tests/tests.mjs


import * as colorPalettes from '../../modules/colors/colorPalettes.mjs';
import * as colorUtils from '../../modules/colors/colorUtils.mjs';
import * as dateUtils from '../../modules/utils/dateUtils.mjs'
import * as domUtils from '../../modules/utils/domUtils.mjs';
import * as jsonUtils from '../../modules/utils/jsonUtils.mjs';
import * as stringUtils from '../../modules/utils/stringUtils.mjs';
import * as utils from '../../modules/utils/utils.mjs';
import * as zUtils from '../utils/zUtils.mjs';


export function runSanityTests() {
    colorUtils.test_colorUtils();
    dateUtils.test_dateUtils();
    domUtils.test_domUtils();
    jsonUtils.test_jsonUtils(); 
    stringUtils.test_stringutils();
    utils.test_utils();
    zUtils.test_zUtils();
}


/** 英文词典分块：仅在切换到英文时加载。 */
import { lazy } from '@core';
import exact from '../../content/i18n/en.exact.json';
import phrases from '../../content/i18n/en.phrases.json';

lazy.provideChunk('i18n-en', { exact, phrases });

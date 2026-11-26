#!/usr/bin/env node
/**
 * 批量调用小米 MiMo TTS API (mimo-v2.5-tts) 为 content/vessels.json 中缺失或需要更新的 3D 器物
 * 生成博物馆资深讲解员导览语音 MP3 并自动回写 audio 字段。
 *
 * 用法：
 *   MIMO_API_KEY=xxx node tools/generate-mimo-tts.mjs          # 仅生成尚无 audio 字段的器物
 *   MIMO_API_KEY=xxx node tools/generate-mimo-tts.mjs --all    # 为全部 15 件器物重新生成对应最新文案的语音
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VESSELS_PATH = path.join(ROOT, 'content/vessels.json');
const AUDIO_DIR = path.join(ROOT, 'public/audio');

const args = process.argv.slice(2);
const FORCE_ALL = args.includes('--all');
const API_KEY = process.env.MIMO_API_KEY || (args.find((a) => a.startsWith('--key=')) || '').slice(6);
const VOICE = process.env.MIMO_VOICE || '白桦';
const ENDPOINT = process.env.MIMO_BASE_URL || 'https://api.xiaomimimo.com/v1/chat/completions';

if (!API_KEY) {
    console.error('[generate-mimo-tts] 缺少 MIMO_API_KEY 环境变量（或 --key=... 参数）。');
    process.exit(1);
}

const vessels = JSON.parse(fs.readFileSync(VESSELS_PATH, 'utf8'));
fs.mkdirSync(AUDIO_DIR, { recursive: true });

function buildNarrationScript(v) {
    const cleanName = String(v.name || '').replace(/·/g, '，');
    const feat = Array.isArray(v.features) && v.features.length ? `它的典型工艺特征包括：${v.features.slice(0, 3).join('、')}。` : '';
    return `${cleanName}。属于${v.period || ''}，产自${v.kiln || ''}，规制尺寸为${v.dimensions || ''}。${v.desc || ''}${feat}`;
}

async function synthesizeSpeech(text) {
    const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'mimo-v2.5-tts',
            messages: [
                {
                    role: 'user',
                    content: '请以博物馆资深文博讲解员的沉稳、温润、富有书卷气的语调缓缓道来，吐字清晰自然，适度停顿。'
                },
                {
                    role: 'assistant',
                    content: text
                }
            ],
            audio: {
                format: 'mp3',
                voice: VOICE
            }
        })
    });
    if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${errBody.slice(0, 300)}`);
    }
    const data = await res.json();
    const b64 = data?.choices?.[0]?.message?.audio?.data;
    if (!b64) {
        throw new Error('响应未包含 message.audio.data 字段: ' + JSON.stringify(data).slice(0, 300));
    }
    return Buffer.from(b64, 'base64');
}

let generated = 0;
for (let i = 0; i < vessels.length; i++) {
    const v = vessels[i];
    const hasValidFile = v.audio && v.audio.file && fs.existsSync(path.join(ROOT, 'public', v.audio.file));
    if (!FORCE_ALL && hasValidFile) {
        console.log(`[skip] #${i + 1} ${v.name} (已有 ${v.audio.file})`);
        continue;
    }

    const numStr = String(i + 1).padStart(2, '0');
    const relAudio = `audio/vessel_${numStr}.mp3`;
    const outPath = path.join(ROOT, 'public', relAudio);
    const script = buildNarrationScript(v);

    console.log(`[tts] #${i + 1} 正在合成: ${v.name} -> ${relAudio}`);
    const mp3Buf = await synthesizeSpeech(script);
    fs.writeFileSync(outPath, mp3Buf);

    v.audio = {
        file: relAudio,
        kind: 'ai-tts',
        engine: '小米 MiMo TTS (mimo-v2.5-tts)',
        note: `AI 合成博物馆资深讲解语音（${VOICE}音色），对应当前档案。`
    };
    generated++;
    // 立即回写，避免中途失败丢失已完成条目
    fs.writeFileSync(VESSELS_PATH, JSON.stringify(vessels, null, 2) + '\n', 'utf8');
}

console.log(`\n[generate-mimo-tts] 完成！本次新合成 ${generated} 件器物语音并已接入 content/vessels.json。`);

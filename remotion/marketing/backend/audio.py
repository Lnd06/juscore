import base64
import requests
import re
import wave
from pathlib import Path
from typing import Optional
from backend.config import settings

def clean_text_for_narration(text: str) -> str:
    """
    Limpa o texto da legenda para que seja lido de forma natural,
    removendo hashtags, CTAs visuais e links.
    """
    lines = text.split("\n")
    cleaned_lines = []
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
            
        line_lower = line.lower()
        if "link na bio" in line_lower or "comente" in line_lower or "clique" in line_lower:
            continue
            
        # Limpa emojis
        line_clean = re.sub(r'[^\w\s.,!?;:()[\]{}"\'\-\+\*=–—]', '', line)
        line_clean = line_clean.strip()
        
        if line_clean:
            cleaned_lines.append(line_clean)
            
    return " ".join(cleaned_lines)

def _call_gemini_audio(model_name: str, cleaned_text: str, output_path: str) -> bool:
    """Função interna para realizar a requisição HTTP ao Gemini para geração de áudio."""
    print(f"🎙️ [Gemini Audio] Solicitando áudio no modelo \"{model_name}\" para: \"{cleaned_text[:60]}...\"")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={settings.GEMINI_API_KEY}"
    
    payload = {
        "contents": [{
            "parts": [{
                "text": (
                    "Você é um narrador profissional brasileiro com voz simpática, clara e articulada. "
                    "Leia o texto a seguir de forma natural, pausada e empática, mantendo a pronúncia perfeita do português do Brasil. "
                    "Gere apenas o áudio lendo estritamente este texto e nada mais:\n\n"
                    f"{cleaned_text}"
                )
            }]
        }],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {
                        "voiceName": "Puck"  # Voz padrão natural
                    }
                }
            }
        }
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=35)
        response.raise_for_status()
        
        res_data = response.json()
        
        candidates = res_data.get("candidates", [])
        if not candidates:
            print(f"⚠️ Resposta do Gemini ({model_name}) não possui candidatos.")
            return False
            
        parts = candidates[0].get("content", {}).get("parts", [])
        audio_part = None
        
        for part in parts:
            if "inlineData" in part:
                audio_part = part["inlineData"]
                break
                
        if not audio_part:
            print(f"⚠️ A resposta do Gemini ({model_name}) não contém dados de áudio inlineData.")
            return False
            
        mime_type = audio_part.get("mimeType", "")
        audio_data_base64 = audio_part.get("data")
        
        if not audio_data_base64:
            return False
            
        audio_bytes = base64.b64decode(audio_data_base64)
        
        # Garante a existência do diretório de saída
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Se for PCM bruto (comum nos modelos de TTS como gemini-2.5-flash-preview-tts)
        if "codec=pcm" in mime_type or "audio/L16" in mime_type:
            # Extrai taxa de amostragem (ex: rate=24000)
            rate = 24000
            rate_match = re.search(r"rate=(\d+)", mime_type)
            if rate_match:
                rate = int(rate_match.group(1))
                
            # Escreve arquivo WAV formatado com os cabeçalhos corretos
            with wave.open(str(output_file), "wb") as wav_file:
                wav_file.setnchannels(1)     # mono
                wav_file.setsampwidth(2)    # 16-bit
                wav_file.setframerate(rate) # 24000 Hz
                wav_file.writeframes(audio_bytes)
            print(f"✅ Áudio PCM convertido e gravado como WAV em: {output_path} ({len(audio_bytes)} bytes)")
        else:
            # Formatos já envelopados (MP3, WAV com header, etc.)
            with open(output_file, "wb") as f:
                f.write(audio_bytes)
            print(f"✅ Áudio gravado diretamente em: {output_path} ({len(audio_bytes)} bytes)")
            
        return True
        
    except Exception as e:
        print(f"❌ Erro ao gerar áudio com o Gemini ({model_name}): {e}")
        return False

def generate_narration_audio(text: str, output_path: str) -> bool:
    """
    Gera a narração de áudio usando o modelo configurado.
    Se falhar, faz um fallback resiliente para gemini-2.5-flash-preview-tts.
    """
    if not settings.GEMINI_API_KEY:
        print("⚠️ GEMINI_API_KEY não configurada no ambiente. Pulando geração de áudio.")
        return False
        
    cleaned_text = clean_text_for_narration(text)
    if not cleaned_text:
        print("⚠️ O texto limpo para narração está vazio. Pulando geração de áudio.")
        return False
        
    # Tenta com o modelo configurado primário (ex: lyria-3-pro-preview)
    success = _call_gemini_audio(settings.GEMINI_AUDIO_MODEL, cleaned_text, output_path)
    
    # Fallback automático se falhar e não for o flash tts
    if not success and settings.GEMINI_AUDIO_MODEL != "gemini-2.5-flash-preview-tts":
        print("🔄 [Gemini Audio] Tentando fallback para o modelo: gemini-2.5-flash-preview-tts")
        success = _call_gemini_audio("gemini-2.5-flash-preview-tts", cleaned_text, output_path)
        
    return success

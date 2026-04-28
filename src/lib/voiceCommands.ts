export const VOICE_COMMANDS: Record<string, Record<string, string>> = {
  en: {
    photo: 'take_photo', timer: 'announce_time', pause: 'pause_timer',
    resume: 'resume_timer', done: 'end_session', info: 'session_info',
    reference: 'show_reference', add: 'add_time',
    lining: 'mode_lining', shading: 'mode_shading',
    needle: 'use_needle', glove: 'use_glove',
    allergy: 'allergy_note', stop: 'emergency_stop',
    summary: 'session_summary', share: 'generate_share',
  },
  es: {
    foto: 'take_photo', tiempo: 'announce_time', pausa: 'pause_timer',
    continuar: 'resume_timer', listo: 'end_session', info: 'session_info',
    referencia: 'show_reference', añadir: 'add_time',
    línea: 'mode_lining', sombra: 'mode_shading',
    aguja: 'use_needle', guante: 'use_glove',
    alergia: 'allergy_note', parar: 'emergency_stop',
    resumen: 'session_summary', compartir: 'generate_share',
  },
  pt: {
    foto: 'take_photo', tempo: 'announce_time', pausa: 'pause_timer',
    continuar: 'resume_timer', pronto: 'end_session', info: 'session_info',
    referência: 'show_reference', adicionar: 'add_time',
    linha: 'mode_lining', sombra: 'mode_shading',
    agulha: 'use_needle', luva: 'use_glove',
    alergia: 'allergy_note', parar: 'emergency_stop',
    resumo: 'session_summary', compartilhar: 'generate_share',
  },
  it: {
    foto: 'take_photo', tempo: 'announce_time', pausa: 'pause_timer',
    riprendi: 'resume_timer', fatto: 'end_session', info: 'session_info',
    riferimento: 'show_reference', aggiungi: 'add_time',
    linea: 'mode_lining', ombra: 'mode_shading',
    ago: 'use_needle', guanto: 'use_glove',
    allergia: 'allergy_note', stop: 'emergency_stop',
    riepilogo: 'session_summary', condividi: 'generate_share',
  },
  de: {
    foto: 'take_photo', zeit: 'announce_time', pause: 'pause_timer',
    fortsetzen: 'resume_timer', fertig: 'end_session', info: 'session_info',
    referenz: 'show_reference', dazu: 'add_time',
    linie: 'mode_lining', schattierung: 'mode_shading',
    nadel: 'use_needle', handschuh: 'use_glove',
    allergie: 'allergy_note', stopp: 'emergency_stop',
    zusammenfassung: 'session_summary', teilen: 'generate_share',
  },
  fr: {
    photo: 'take_photo', temps: 'announce_time', pause: 'pause_timer',
    reprendre: 'resume_timer', fini: 'end_session', info: 'session_info',
    référence: 'show_reference', ajouter: 'add_time',
    ligne: 'mode_lining', ombre: 'mode_shading',
    aiguille: 'use_needle', gant: 'use_glove',
    allergie: 'allergy_note', stop: 'emergency_stop',
    résumé: 'session_summary', partager: 'generate_share',
  },
};

export function getCommandsForLocale(): Record<string, string> {
  const lang = navigator.language.split('-')[0];
  return VOICE_COMMANDS[lang] || VOICE_COMMANDS.en;
}

// Arranque de la página: cada botón lleva a donde sirve en este celular y, si el
// enlace trae una invitación, se muestra su talón. La cuenta se monta sola
// (cuenta.js).
import { aplicarDestinos, tipoDispositivo } from './dispositivo.js';
import { montarInvitacion } from './invitacion.js';

aplicarDestinos(document, tipoDispositivo(navigator.userAgent, navigator.platform, navigator.maxTouchPoints));
montarInvitacion(document, location, navigator);

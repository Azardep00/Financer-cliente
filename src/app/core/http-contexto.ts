import { HttpContextToken } from '@angular/common/http';

/** Poner en true cuando la pantalla muestra el error por su cuenta (formularios, "404 = aún no hay datos"). */
export const SILENCIAR_ERRORES = new HttpContextToken<boolean>(() => false);

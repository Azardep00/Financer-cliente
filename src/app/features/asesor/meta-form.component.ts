import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Diagnostico, Meta, MetaRequest, TipoMeta } from '../../core/models';
import { cop } from '../../core/formato';

export const ETIQ_TIPO: Record<TipoMeta, string> = {
  TEXTO: 'Meta de texto (se marca a mano)',
  AHORRO: 'Subir el ahorro',
  REDUCCION_DEUDA: 'Bajar la deuda',
  REDUCCION_GASTO: 'Bajar el gasto mensual',
};

/** Formulario de una meta: de texto o medible. Se usa para crear, editar y armar el plan. */
@Component({
  selector: 'app-meta-form',
  standalone: true,
  imports: [FormsModule],
  styleUrl: './planes.css',
  template: `
    <form class="meta-form" (submit)="$event.preventDefault(); enviar()" novalidate>
      <div class="campo ancho-total">
        <label [for]="id + '-desc'">Descripción de la meta</label>
        <input [id]="id + '-desc'" class="entrada" name="desc" [(ngModel)]="f.descripcion" maxlength="250"
               placeholder="Ej.: Ahorrar para el fondo de emergencia" [class.invalida]="intento && !f.descripcion.trim()" />
      </div>
      <div class="campo">
        <label [for]="id + '-tipo'">Tipo de meta</label>
        <select [id]="id + '-tipo'" class="entrada" name="tipo" [(ngModel)]="f.tipo" (ngModelChange)="alCambiarTipo()">
          @for (t of tipos; track t) { <option [value]="t">{{ etiq[t] }}</option> }
        </select>
      </div>
      <div class="campo">
        <label [for]="id + '-fecha'">Fecha límite (opcional)</label>
        <input [id]="id + '-fecha'" class="entrada" type="date" name="fecha" [(ngModel)]="f.fechaLimite" [min]="min" [max]="max" />
      </div>
      @if (f.tipo !== 'TEXTO') {
        <div class="campo">
          <label [for]="id + '-ini'">Valor de partida (COP)</label>
          <input [id]="id + '-ini'" class="entrada" type="number" min="0" step="1000" name="ini" [(ngModel)]="f.inicial"
                 [class.invalida]="intento && !num(f.inicial)" />
          <span class="campo-ayuda">{{ ayudaInicial() }}</span>
        </div>
        <div class="campo">
          <label [for]="id + '-obj'">Monto objetivo (COP)</label>
          <input [id]="id + '-obj'" class="entrada" type="number" min="0" step="1000" name="obj" [(ngModel)]="f.monto"
                 [class.invalida]="intento && !num(f.monto)" />
          <span class="campo-ayuda">{{ f.tipo === 'AHORRO' ? 'Debe ser mayor que el valor de partida.' : 'Debe ser menor que el valor de partida.' }}</span>
        </div>
      }
      @if (error) { <p class="campo-error ancho-total" role="alert">{{ error }}</p> }
      <div class="acciones ancho-total">
        <button type="submit" class="btn btn-primario btn-sm" [disabled]="ocupado">{{ etiqueta }}</button>
        <button type="button" class="btn btn-fantasma btn-sm" (click)="cancelar.emit()">Cancelar</button>
      </div>
    </form>`,
})
export class MetaFormComponent implements OnInit {
  private static n = 0;
  id = 'mf' + MetaFormComponent.n++;
  tipos = Object.keys(ETIQ_TIPO) as TipoMeta[];
  etiq = ETIQ_TIPO;

  /** Meta a editar; si falta, el formulario arranca vacío. */
  @Input() meta: Meta | null = null;
  @Input() ultimo: Diagnostico | null = null;
  @Input() etiqueta = 'Guardar meta';
  @Input() ocupado = false;
  @Input() min: string | null = null;
  @Input() max: string | null = null;
  @Output() guardar = new EventEmitter<MetaRequest>();
  @Output() cancelar = new EventEmitter<void>();

  f: { descripcion: string; fechaLimite: string; tipo: TipoMeta; inicial: number | null; monto: number | null } =
    { descripcion: '', fechaLimite: '', tipo: 'TEXTO', inicial: null, monto: null };
  intento = false;
  error = '';

  ngOnInit() {
    const m = this.meta;
    if (m) this.f = { descripcion: m.descripcion, fechaLimite: m.fechaLimite ?? '', tipo: m.tipo, inicial: m.valorInicial, monto: m.montoObjetivo };
  }

  num = (n: number | null) => n !== null && n !== undefined && !isNaN(Number(n)) && Number(n) >= 0 && String(n) !== '';

  /** Sugiere el valor de partida con el último diagnóstico del cliente. */
  alCambiarTipo() {
    const d = this.ultimo;
    if (!d || this.f.tipo === 'TEXTO') return;
    this.f.inicial = this.f.tipo === 'AHORRO' ? d.ahorroActual : this.f.tipo === 'REDUCCION_DEUDA' ? d.deudaTotal : d.gastoMensual;
  }

  ayudaInicial() {
    const d = this.ultimo;
    if (!d) return 'Aún no hay diagnóstico: escribe el valor actual.';
    const v = this.f.tipo === 'AHORRO' ? d.ahorroActual : this.f.tipo === 'REDUCCION_DEUDA' ? d.deudaTotal : d.gastoMensual;
    return `Último diagnóstico: ${cop(v)}.`;
  }

  enviar() {
    this.intento = true; this.error = '';
    const f = this.f;
    if (!f.descripcion.trim()) { this.error = 'Escribe la descripción de la meta.'; return; }
    const req: MetaRequest = { descripcion: f.descripcion.trim(), fechaLimite: f.fechaLimite || null, tipo: f.tipo };
    if (f.tipo !== 'TEXTO') {
      if (!this.num(f.inicial) || !this.num(f.monto)) { this.error = 'Completa el valor de partida y el monto objetivo (cero o más).'; return; }
      const ini = Number(f.inicial), obj = Number(f.monto);
      if (f.tipo === 'AHORRO' && obj <= ini) { this.error = 'En una meta de ahorro, el objetivo debe ser mayor que el valor de partida.'; return; }
      if (f.tipo !== 'AHORRO' && obj >= ini) { this.error = 'En una meta de reducción, el objetivo debe ser menor que el valor de partida.'; return; }
      req.valorInicial = ini; req.montoObjetivo = obj;
    }
    this.guardar.emit(req);
  }
}

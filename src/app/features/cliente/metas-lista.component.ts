import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Meta, TipoMeta } from '../../core/models';
import { cop, fechaCorta } from '../../core/formato';

const TIPO: Record<TipoMeta, string> = {
  TEXTO: 'Meta de texto', AHORRO: 'Ahorro', REDUCCION_DEUDA: 'Reducir deuda', REDUCCION_GASTO: 'Reducir gasto',
};

/** Lista de metas. Si `editable`, el cliente puede marcar las metas de texto; las medibles se actualizan solas con cada diagnóstico. */
@Component({
  selector: 'app-metas-lista',
  standalone: true,
  template: `
    @if (metas.length === 0) {
      <div class="vacio"><strong>Sin metas</strong>Tu asesor aún no ha agregado metas a este plan.</div>
    } @else {
      <ul class="metas">
        @for (m of metas; track m.idMeta) {
          <li [class.hecha]="m.completada">
            <div class="fila">
              @if (editable && !m.medible) {
                <input type="checkbox" [checked]="m.completada" [disabled]="ocupada === m.idMeta"
                       (change)="alternar.emit(m)" [attr.aria-label]="'Marcar como ' + (m.completada ? 'pendiente' : 'cumplida') + ': ' + m.descripcion" />
              } @else {
                <span class="marca" [class.si]="m.completada" aria-hidden="true">{{ m.completada ? '✓' : '' }}</span>
              }
              <div class="cuerpo">
                <div class="titulo">{{ m.descripcion }}</div>
                <div class="sub">
                  {{ tipo(m.tipo) }}
                  @if (m.fechaLimite) { · vence {{ fecha(m.fechaLimite) }} }
                  @if (m.completada && m.fechaCompletada) { · cumplida {{ fecha(m.fechaCompletada) }} }
                </div>
              </div>
              <span class="etiqueta-estado" [class.etiqueta-ok]="m.completada" [class.etiqueta-info]="!m.completada && m.medible">
                {{ m.completada ? 'Cumplida' : m.medible ? m.progreso.toFixed(0) + '%' : 'Pendiente' }}
              </span>
            </div>
            @if (m.medible) {
              <div class="barra" role="progressbar" [attr.aria-valuenow]="m.progreso" aria-valuemin="0" aria-valuemax="100"
                   [attr.aria-label]="'Avance de ' + m.descripcion"><span [style.width.%]="m.progreso"></span></div>
              <div class="montos">
                <span>Inicio <b>{{ cop(m.valorInicial) }}</b></span>
                <span>Actual <b>{{ cop(m.valorActual ?? m.valorInicial) }}</b></span>
                <span>Objetivo <b>{{ cop(m.montoObjetivo) }}</b></span>
              </div>
            }
          </li>
        }
      </ul>
    }`,
  styles: [`
    .metas { list-style: none; margin: 0; padding: 0; display: grid; gap: .6rem; }
    li { border: 1px solid var(--borde); border-radius: var(--radio); padding: .8rem .9rem; background: var(--superficie); }
    li.hecha { background: #fafbfc; }
    .fila { display: flex; align-items: center; gap: .75rem; }
    .cuerpo { flex: 1; min-width: 0; }
    .titulo { font-weight: 500; }
    li.hecha .titulo { color: var(--suave); text-decoration: line-through; }
    .sub { font-size: .8125rem; color: var(--suave); }
    input[type=checkbox] { width: 18px; height: 18px; accent-color: var(--primario); flex: none; cursor: pointer; }
    .marca { width: 18px; height: 18px; flex: none; border: 1.5px solid var(--borde-fuerte); border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; color: #fff; }
    .marca.si { background: var(--ok); border-color: var(--ok); }
    .barra { height: 8px; background: var(--fondo); border-radius: 4px; margin-top: .7rem; overflow: hidden; border: 1px solid var(--borde); }
    .barra span { display: block; height: 100%; background: var(--primario); }
    li.hecha .barra span { background: var(--ok); }
    .montos { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .25rem 1rem; margin-top: .45rem; font-size: .8125rem; color: var(--suave); }
    .montos b { color: var(--texto); font-weight: 600; }
  `],
})
export class MetasListaComponent {
  @Input() metas: Meta[] = [];
  @Input() editable = false;
  @Input() ocupada: number | null = null;
  @Output() alternar = new EventEmitter<Meta>();
  cop = cop;
  fecha = fechaCorta;
  tipo = (t: TipoMeta) => TIPO[t] ?? t;
}

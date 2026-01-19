import { FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { User } from './interfaces/user.interface';
import { SupabaseClient } from '@supabase/supabase-js';
import { DynamicFormField } from './interfaces/dynamic-form-field.interface';

export abstract class AppUtils {

  static getUserFullName(user: User): string {
    return `${user.name} ${user.last_names}`;
  }

  static getControlValidators(validators: any): ValidatorFn[] {
    const validatorsFn: ValidatorFn[] = [];

    if (!!validators) {
      if (validators.required) {
        validatorsFn.push(Validators.required);
      }
      if (validators.email) {
        validatorsFn.push(Validators.email);
      }
    }
    return validatorsFn;
  }

  static listenToDependentSelects(
    supabase: SupabaseClient,
    form: FormGroup,
    formFields: DynamicFormField[],
    setLoading?: (value: boolean) => void
  ): void {
    // 1) Solo selects dependientes
    const dependentFields = formFields.filter(
      f => f.type === 'select' && !!f.depends_on_field
    );

    // Mapa por nombre para resolver padres si estuvieran en otra sección
    const fieldsByName = formFields.reduce<Record<string, DynamicFormField[]>>((acc, f) => {
      (acc[f.name] ||= []).push(f);
      return acc;
    }, {});

    for (const child of dependentFields) {
      const parentName = child.depends_on_field as string;

      // 2) Intentar padre en la misma sección; si no existe, tomar el primero con ese name
      const parent =
        (fieldsByName[parentName] || []).find(p => p.section_id === child.section_id) ||
        (fieldsByName[parentName] || [])[0];

      if (!parent) {
        console.warn(`No se encontró el campo padre "${parentName}" para el hijo "${child.name}".`);
        continue;
      }

      // 3) Obtener controles por RUTA (section_id, name)
      const parentCtrl = form.get([parent.section_id, parent.name]);
      const childCtrl = form.get([child.section_id, child.name]);

      if (!parentCtrl || !childCtrl) {
        console.warn('No se encontró FormControl para padre/hijo:', { parent, child });
        continue;
      }

      const loadOptions = async (parentValue: any) => {
        // Reset de valor del hijo
        childCtrl.setValue('');

        if (!parentValue) {
          // Deja solo placeholder si aplica
          child.options = [{ value: '', label: '-- Seleccione --' }];
          return;
        }

        if (!child.data_source || !child.data_value_column || !child.data_label_column) return;

        try {
          setLoading?.(true);

          // IMPORTANTE: aquí asumimos que la columna a filtrar en la tabla = nombre del campo padre.
          // Si no fuera así, agrega un campo como child.depends_on_column en tu BD/RPC y úsalo aquí.
          const { data, error } = await supabase
            .from(child.data_source)
            .select(`${child.data_value_column}, ${child.data_label_column}`)
            .eq(parentName, parentValue)
            .order(child.data_label_column, { ascending: true });

          if (error) {
            console.error(`Error loading options for ${child.name}:`, error);
            return;
          }

          const valueKey = child.data_value_column as string;
          const labelKey = child.data_label_column as string;

          child.options = [
            { value: '', label: '-- Seleccione --' },
            ...data.map((row: any) => ({
              value: row[valueKey],
              label: row[labelKey],
            })),
          ];
        } finally {
          setLoading?.(false);
        }
      };

      // 4) Suscripción + disparo inicial si ya tiene valor
      const sub = parentCtrl.valueChanges.subscribe(loadOptions);
      // carga inicial (por si el padre ya venía con valor)
      if (parentCtrl.value !== null && parentCtrl.value !== undefined && parentCtrl.value !== '') {
        // no aguardamos a la suscripción para tener opciones desde el inicio
        void loadOptions(parentCtrl.value);
      }
    }
  }


}

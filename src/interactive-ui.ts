import QuickSettings, { AnyModel, QuickSettingsPanel } from 'quicksettings';

let lastX = 10;

interface Base<T> {
  accessor: keyof T;
  initial?: any;
}

interface Button<T> extends Base<T> {
  type: 'button';
}

interface Boolean<T> extends Base<T> {
  type: 'boolean';
}

interface DropDown<T> extends Base<T> {
  type: 'drop-down';
  values: string[];
}

interface Range<T> extends Base<T> {
  type: 'range';
}

interface Element<T> extends Base<T> {
  type: 'element';
}

type Property<T> = Button<T> | Boolean<T> | DropDown<T> | Range<T> | Element<T>;

export interface Interactive<T> {
  ctor: () => T;
  properties: Property<T>[];
}

export class InteractiveUI<T extends Object> {
  private settings: QuickSettingsPanel<AnyModel, string>;
  private instance: T;

  constructor(
    { x, y }: { x: number; y: number },
    private interactive: Interactive<T>
  ) {
    this.instance = this.interactive.ctor();
    this.settings = QuickSettings.create(x, y, this.instance.constructor.name);

    const anySettings = this.settings as any;
    anySettings._panel.style.width = 'auto';
  }

  build() {
    this.interactive.properties.forEach(p => {
      let instanceProp = this.instance[p.accessor] as any;

      if (typeof instanceProp === 'function') {
        instanceProp = instanceProp.bind(this.instance);
      }

      const accessorString = p.accessor.toString();

      switch (p.type) {
        case 'boolean':
          this.settings.addBoolean(accessorString, true, instanceProp);
          break;
        case 'button':
          this.settings.addButton(accessorString, instanceProp);
          break;
        case 'drop-down':
          this.settings.addDropDown(accessorString, p.values, ({ value }) =>
            instanceProp(value)
          );
          break;
        case 'element':
          this.settings.addElement(accessorString, instanceProp);
          break;
        case 'range':
          this.settings.addRange(accessorString, 0, 1, 0, 0.1, instanceProp);
          break;
      }

      if (p.initial) {
        this.settings.setValue(accessorString, p.initial);
      }
    });
  }
}

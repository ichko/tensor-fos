import QuickSettings from 'quicksettings';

interface BaseWidget {
  initial?: any;
  title?: string;
}

interface Button extends BaseWidget {
  type: 'button';
  update: () => void;
}

interface Boolean extends BaseWidget {
  type: 'boolean';
  update: (val: boolean) => void;
}

interface DropDown extends BaseWidget {
  type: 'drop-down';
  values: any[];
  update: (val: any) => void;
}
interface Text extends BaseWidget {
  type: 'text';
  update: (val: string) => void;
}

interface Range extends BaseWidget {
  type: 'range';
  min: number;
  max: number;
  initial: number;
  step: number;
  update: (val: number) => void;
}

interface Number extends BaseWidget {
  type: 'number';
  min: number;
  max: number;
  initial: number;
  step: number;
  update: (val: number) => void;
}

interface Element extends BaseWidget {
  type: 'element';
  element: HTMLElement;
}

type Widget = Button | Boolean | DropDown | Text | Range | Element | Number;

interface Props {
  title: string;
  pos: { x: number; y: number };
  widgets: Widget[];
}

export class QuickSettingsWidgetUI {
  private widgets: Widget[];
  private title: string;
  private pos: { x: number; y: number };

  private element: ChildNode;

  get domElement() {
    return this.element;
  }

  constructor({ pos, title, widgets }: Props) {
    this.pos = pos;
    this.widgets = widgets;
    this.title = title;

    const parent = document.createElement('div');
    const settings = QuickSettings.create(
      this.pos.x,
      this.pos.y,
      this.title,
      parent
    );

    this.element = parent.firstChild!;

    const anySettings = settings as any;
    anySettings._panel.style.width = 'auto';

    this.widgets.forEach(w => {
      const { title = '', initial } = w;

      switch (w.type) {
        case 'boolean':
          settings.addBoolean(title, initial, w.update);
          break;
        case 'button':
          settings.addButton(title, w.update);
          break;
        case 'drop-down':
          settings.addDropDown(title, w.values, ({ value }) => w.update(value));
          break;
        case 'element':
          settings.addElement(title, w.element);
          break;
        case 'text':
          settings.addText(title, initial, w.update);
          break;
        case 'range':
          settings.addRange(title, w.min, w.max, w.initial, w.step, w.update);
          break;
        case 'number':
          settings.addNumber(title, w.min, w.max, w.initial, w.step, w.update);
          break;
      }
    });
  }
}

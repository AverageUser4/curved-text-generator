const spx = 10;
const spy = 250;
const cpx = 250;
const cpy = 100;
const epx = 490;
const epy = 250;

class TheHandler {

  focusedCircle = null;
  allFocusButtons;

  textAutoCenter = true;
  textXInputs;

  points = {};

  font = {
    textContent: 'My Curved Text :)',
    size: 32,
    x: 250,
    anchor: 'middle',
    family: null
  };

  constructor() {
    this.pointInputs = document.querySelectorAll('[data-point-inputs-container]');

    this.svg = document.querySelector('svg');
    this.text = document.querySelector('text');
    this.readableSource = document.querySelector('#readable-source-container');
    this.path = document.querySelector('path');

    this.startCircle = document.querySelector('[data-path-circle="start"]');
    this.controlCircle = document.querySelector('[data-path-circle="control"]');
    this.endCircle = document.querySelector('[data-path-circle="end"]');

    this.#randomiseId();
    this.updateReadableSource();

    this.#addTextListeners();

    this.resetPath();
    this.updateText();

    this.#addPathListeners();
    this.#addButtonListeners();

    this.#addCircleListeners();

    // sync adjacent inputs
    for(let val of document.querySelectorAll('[data-number-and-range]'))
      for(let val_2 of val.querySelectorAll('[type="number"], [type="range"]'))
        val_2.addEventListener('input', (event) => this.doubleInputUpdate(event));
  }

  updateInputs() {
    for(let val of this.pointInputs)
      for (let val_2 of val.querySelectorAll('[type="range"], [type="number"]'))
        val_2.value = this.points[val.getAttribute('data-point-inputs-container')];
  }

  #addCircleListeners() {
    const circles = document.querySelectorAll('[data-path-circle]');

    window.addEventListener('click', (event) => {
      for(let val of circles) {
        if(val === this.focusedCircle) {
          this.focusedCircle = null;
          for(let val_2 of this.allFocusButtons)
            val_2.classList.remove('focus-button--active');
        }
        else if(val === event.target) {
          this.focusedCircle = val;
          for(let val_2 of this.allFocusButtons)
            if(
                val_2.getAttribute('data-button-focus') === 
                this.focusedCircle.getAttributeNS(null, 'data-path-circle')  
              )
            val_2.classList.add('focus-button--active');
        }
      }
    });

    window.addEventListener('mousemove', (event) => {
      if(!this.focusedCircle)
        return;

      const svgRect = this.svg.getBoundingClientRect();

      const x = event.pageX - svgRect.x;
      const y = event.pageY - svgRect.y;

      this.focusedCircle.setAttributeNS(null, 'cx', x);
      this.focusedCircle.setAttributeNS(null, 'cy', y);

      switch(this.focusedCircle.getAttributeNS(null, 'data-path-circle')) {
        case 'start':
          this.points.startPointX = x;
          this.points.startPointY = y;
          break;

        case 'control':
          this.points.controlPointX = x;
          this.points.controlPointY = y;
          break;

        case 'end':
          this.points.endPointX = x;
          this.points.endPointY = y;
          break;
      }

      this.updatePath();
    });
  }

  #addButtonListeners() {
    document.querySelector('[data-button="reset-path"]').addEventListener('click', () => this.resetPath());
    document.querySelector('[data-button="crop-svg"]').addEventListener('click', () => this.adjustSVGSize());
    document.querySelector('[data-button="reset-svg"]').addEventListener('click', () => {
      this.svg.setAttributeNS(null, 'viewBox', `0 0 500 500`);
      this.svg.setAttributeNS(null, 'width', 500);
      this.updateInputs();
    });

    this.allFocusButtons = document.querySelectorAll('[data-button-focus]');

    for(let val of this.allFocusButtons) {
      val.addEventListener('click', (event) => {
        const which = event.currentTarget.getAttribute('data-button-focus');

        if(this.focusedCircle === this[`${which}Circle`]) {
          event.currentTarget.classList.remove('focus-button--active');
          this.focusedCircle = null;
          return;
        }

        for(let val of this.allFocusButtons)
          val.classList.remove('focus-button--active');

        event.currentTarget.classList.add('focus-button--active');

        this.focusedCircle = this[`${which}Circle`];

        event.stopPropagation();
      });
    }
  }

  #randomiseId() {
    const path = document.querySelector('[data-path]');
    const textPath = document.querySelector('[data-text-path]');
    const id = `ctg-text-path-${Math.random().toFixed(5)}`;
    path.setAttributeNS(null, 'id', id);
    textPath.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + id);
  }

  #addTextListeners() {
    const textContentInput = 
    document.querySelector('[data-text-inputs-container="textContent"').children[0];

    textContentInput.addEventListener('input', (event) => {
      this.font.textContent = event.currentTarget.value;
      this.updateText();
    });

    const fontSizeInputs = 
      document.querySelector('[data-text-inputs-container="fontSize"')
      .querySelectorAll('input[type="number"], input[type="range"]');

    for(let val of fontSizeInputs) {
      val.value = this.font.size;
      val.addEventListener('input', () => {
        this.font.size = val.value;
        this.updateText();
      });
    }

    this.textXInputs = 
      document.querySelector('[data-text-inputs-container="textX"')
      .querySelectorAll('input[type="number"], input[type="range"]');

    for(let val of this.textXInputs) {
      val.value = this.font.x;
      val.addEventListener('input', () => {
        this.font.x = val.value;
        this.updateText();
      });
    }

    const centerCheckbox = document.querySelector('[data-config="textCenter"]');
    centerCheckbox.checked = true;

    centerCheckbox.addEventListener('change', () => {
      this.textAutoCenter = centerCheckbox.checked;
    });
    
    const textAnchorSelect = document.querySelector('[data-input="textAnchor"');
    textAnchorSelect.selectedIndex = 0;

    textAnchorSelect.addEventListener('change', () => {
      this.font.anchor = textAnchorSelect.value;
      this.updateText();
    });

  }

  #addPathListeners() {
    const names = ['startPointX', 'startPointY', 
      'controlPointX', 'controlPointY', 'endPointX', 'endPointY']

    for(let val of names) {
      const inputContainer = 
        document.querySelector(`[data-point-inputs-container="${val}"`);

      const numberInput = inputContainer.querySelector('input[type="number"]');
      const rangeInput = inputContainer.querySelector('input[type="range"]');

      numberInput.value = rangeInput.value = this.points[val];

      numberInput.addEventListener('input', (event) => this.pathInputUpdate(event));
      rangeInput.addEventListener('input', (event) => this.pathInputUpdate(event));
    }
  }

  updateText() {
    this.text.children[0].textContent = this.font.textContent;
    this.text.style.fontSize = this.font.size + 'px';
    this.text.setAttributeNS(null, 'x', this.font.x);
    this.text.setAttributeNS(null, 'text-anchor', this.font.anchor);

    this.updateReadableSource();
  }

  resetPath() {
    this.points.startPointX = spx;
    this.points.startPointY = spy;
    this.points.controlPointX = cpx;
    this.points.controlPointY = cpy;
    this.points.endPointX = epx;
    this.points.endPointY = epy;

    this.updatePath();
  }

  updatePath() {
    this.path.setAttributeNS(null, 'd', 
      `M ${this.points.startPointX},${this.points.startPointY}
       Q ${this.points.controlPointX},${this.points.controlPointY}
         ${this.points.endPointX},${this.points.endPointY}`
    );

    if(this.textAutoCenter) {
      this.text.setAttributeNS(null, 'x', this.points.controlPointX);
      for(let val of this.textXInputs)
        val.value = this.points.controlPointX;
    }

    this.updateReadableSource();
    this.updateInputs();
  }

  updateCircle(which) {
    this[`${which}Circle`].setAttributeNS(null, 'cx', this.points[`${which}PointX`]);
    this[`${which}Circle`].setAttributeNS(null, 'cy', this.points[`${which}PointY`]);
  }

  pathInputUpdate(event) {
    const ct = event.currentTarget;
    const value = ct.value;

    const parameter = ct.parentElement.getAttribute('data-point-inputs-container');
    this.points[parameter] = Number(value);

    this.updateCircle(parameter.slice(0, parameter.indexOf('Point')));

    this.updatePath();
  }

  doubleInputUpdate(event) {
    const ct = event.currentTarget;
    const value = ct.value;
    
    for(let val of ct.parentElement.querySelectorAll('input'))
      val.value = value;
  }

  updateReadableSource() {
    let source = this.svg.outerHTML
      .replace('stroke="red"', '')
      .replace('class="the-main__svg"', '')
      .replace('data-path="1"', '')
      .replace('data-text-path="1"', '');

    this.readableSource.textContent = source
      .replace(
        source.slice(
          source.indexOf('<circle'),
          source.lastIndexOf('</circle>') + 9
        ), ''
      );
  }

  adjustSVGSize() {
    const svgRect = this.svg.getBoundingClientRect();
    const textRect = this.text.getBoundingClientRect();

    let textOffsetX = Math.round(Math.abs(svgRect.x - textRect.x));
    let textOffsetY = Math.round(Math.abs(svgRect.y - textRect.y));

    if(textRect.x > svgRect.x)
      textOffsetX *= -1;

    if(textRect.y > svgRect.y)
      textOffsetY *= -1;

    this.points.startPointX += textOffsetX;
    this.points.controlPointX += textOffsetX;
    this.points.endPointX += textOffsetX;
    this.points.startPointY += textOffsetY;
    this.points.controlPointY += textOffsetY;
    this.points.endPointY += textOffsetY;

    const w = textRect.width;
    const h = textRect.height;
    this.svg.setAttributeNS(null, 'viewBox', `0 0 ${w} ${h}`);
    this.svg.setAttributeNS(null, 'width', w);

    this.updatePath();
    this.updateText();
    this.updateInputs();
  }

}

export default new TheHandler;

const styleSheet = new CSSStyleSheet();
document.adoptedStyleSheets.push(styleSheet);

const f = document.querySelector('[type="file"]');

f.addEventListener('change', () => {
  const reader = new FileReader();
  reader.addEventListener('load', (event) => {
    console.log(event.target.result);
    styleSheet.insertRule(`
      @font-face {
        font-family: penis;
        src: url(${event.target.result});
      }
    `);
  });
  reader.readAsDataURL(f.files[0]);
  
});
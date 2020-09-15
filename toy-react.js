const RENDER_TO_DOM = Symbol("render to dom");

/**
 * @typedef {{[key: string]: *}} jsonType
 */

class ElementWrapper{
    /**
     * 
     * @param {string} type - 标签名称
     */
    constructor(type){
        /** @type HTMLElement */
        this.root = document.createElement(type);
    }

    /**
     * 
     * @param {string} name - 属性名称
     * @param {*} value - 属性值
     */
    setAttribute(name, value){
        if(name.match(/^on([\s\S]+)$/)){
            this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value);
        }else{

            if(name === 'className'){
                this.root.setAttribute('class', value);
            }else{

                this.root.setAttribute(name, value);
            }

        }
        
    }

    appendChild(component){
        let range = document.createRange();

        range.setStart(this.root, this.root.childNodes.length);
        range.setEnd(this.root, this.root.childNodes.length);
        /** 删除也可以 */
        range.deleteContents();

        component[RENDER_TO_DOM](range);
    }

    /**
     * 
     * @param {Range} range - 选区
     */
    [RENDER_TO_DOM](range){
        range.deleteContents();
        range.insertNode(this.root);
    }
}

class TextWrapper{
    /**
     * 
     * @param {string} content - 文字内容
     */
    constructor(content){
        /** @type Text */
        this.root = document.createTextNode(content);
    }
    
    /**
     * 
     * @param {Range} range - 选区
     */
    [RENDER_TO_DOM](range){
        range.deleteContents();
        range.insertNode(this.root);
    }
}

export class Component{
    constructor(){
        this.props = Object.create(null);
        this.children = [];
        this._root = null;
        this._range = null;
    }

    setAttribute(name, value){
        this.props[name] = value;
    }

    appendChild(component){
        this.children.push(component);
    }

    /**
     * 
     * @param {Range} range - 选区
     */
    [RENDER_TO_DOM](range){
        this._range = range;
        this.render()[RENDER_TO_DOM](range);
    }

    /**
     * 重新绘制
     */
    rerender(){
        let oldRange = this._range;

        /** 分成三段 */
        let range = document.createRange();
        range.setStart(oldRange.startContainer, oldRange.startOffset);
        range.setEnd(oldRange.startContainer, oldRange.startOffset);
        this[RENDER_TO_DOM](range);

        oldRange.setStart(range.endContainer, range.endOffset);
        oldRange.deleteContents();
    }

    /**
     * 
     * @param {jsonType} newState - 新状态
     */
    setState(newState){

        if(this.state === null || typeof this.state !== 'object'){
            this.state = newState;
            this.rerender();
            return;
        }

        /**
         * 把新状态合并到老状态中
         * @param {jsonType} oldState - 旧状态
         * @param {jsonType} newState - 新状态
         */
        let merge = (oldState, newState) => {

            for(let p in newState){
                if(oldState[p] === null || typeof oldState[p] !== 'object'){
                    oldState[p] = newState[p];
                }else{
                    merge(oldState[p], newState[p]);
                }
            }
        }

        merge(this.state, newState);

        this.rerender();
    }
}

export function createElement(type, attributes, ...children){

    let e;

    if(typeof type === 'string'){
        e = new ElementWrapper(type);   
    }else{
        e = new type;
    }

    for(let p in attributes){
        e.setAttribute(p, attributes[p]);
    }

    let insertChildren = (children) => {
        for(let child of children){
            if(typeof child === 'string'){
                child = new TextWrapper(child);
            }

            if(child === null){
                continue;
            }
    
            if((typeof child === 'object') && (child instanceof Array)){
                insertChildren(child);
            }else{
                e.appendChild(child);
            }
            
        }
    };

    insertChildren(children);

    return e;
}

/**
 * 渲染函数
 * @param {Component} component - 要渲染的元素
 * @param {HTMLElement} parentElement - 父元素
 */
export function render(component, parentElement){
    
    let range = document.createRange();

    /** 删除内容 */
    range.setStart(parentElement, 0);
    range.setEnd(parentElement, parentElement.childNodes.length);
    range.deleteContents();
    
    component[RENDER_TO_DOM](range);
}
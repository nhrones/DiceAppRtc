
import { Geometry, RenderAttributes, ElementDescriptor } from '../../types.js'
import { getStyles } from './styles.js'

export const components: ElementDescriptor[] = []
let component: ElementDescriptor | null = null

/** Builds a set of IElementDescriptors by examining the loaded   
 * HTML document, and CSS stylesheets.  
 * Called from DOMContentLoaded event handler (app.js)    
 */
export const compileUI = () => {
    // get reference to our parent HTML tag <surface>
    const surfaceElement = document.getElementById('surface')!
    // retrieve all childNodes from the <surface> node
    const nodes = surfaceElement.childNodes as NodeListOf<HTMLElement>

    // loop over all tags inside the 'surface' tag
    for (const element of nodes) {
        // skip any 'empty' text nodes
        if (element.tagName) {
            // hydrate the node 
            hydrateElement(element)
        }
    }
    // store the components(ElementDescriptors) to a file
    localStorage.setItem('elementDescriptors', JSON.stringify(components));
}

/** Creates an 'ElementDescriptor' object from HTML markup (tags),    
 *  and from CSS stylesheets. Attribute values in markup will take     
 *  presidence over values found in stylesheets.  
 *  The ElementDescriptor objects will be used to build and render 
 *  virtual canvas Elements.  
 */
function hydrateElement(thisElement: HTMLElement): ElementDescriptor {
    const tagName = thisElement.tagName.toLowerCase()
    const styles = getStyles(thisElement)
    component = {
        kind: tagName,
        id: getStringAttribute(thisElement, 'id'),
        idx: getNumbericAttribute(thisElement, 'idx', 0),
        pathGeometry: getPathGeometry(thisElement, styles),
        renderAttributes: getAttributes(thisElement, styles)
    }
    components.push(component)
    return component
}

/** returns a path geometry object from either HTML tag attributes 
 * or CSS styles ... HTML tag attributes override CSS styles
 */
function getPathGeometry(thisElement: HTMLElement, styles: any): Geometry {
    // first, load any attribute values
    const l = getNumbericAttribute(thisElement, 'left')
    const t = getNumbericAttribute(thisElement, 'top')
    const w = getNumbericAttribute(thisElement, 'width')
    const h = getNumbericAttribute(thisElement, 'height')
    const r = getNumbericAttribute(thisElement, 'radius')
    // now, if it was not in attributes, get it from styles, else add a default
    return {
        left: (l > 0) ? l : (styles.left) ? parseInt(styles.left) : 10,
        top: (t > 0) ? t : (styles.top) ? parseInt(styles.top) : 10,
        width: (w > 0) ? w : (styles.width) ? parseInt(styles.width) : 10,
        height: (h > 0) ? h : (styles.height) ? parseInt(styles.height) : 10,
        radius: (r > 0) ? r : (styles['border-radius']) ? parseInt(styles['border-radius']) : 15
    } as Geometry
}

/** Returns an 'Attributes' object from both    
 * HTML tag attributes and CSS styles.
 * NOTE: tag attributes will always override CSS styles
 */
function getAttributes(thisElement: HTMLElement, styles: any) {
    const strokeClr = getStringAttribute(thisElement, 'strokeColor')
    const fillClr = getStringAttribute(thisElement, 'fillColor')
    const fntSize = getStringAttribute(thisElement, 'font-size')
    return {
        strokeColor: (strokeClr) ? strokeClr : (styles.stroke) ? styles.stroke : 'black',
        fillColor: (fillClr) ? fillClr : (styles.fill) ? styles.fill : 'red',
        fontColor: getStringAttribute(thisElement, 'fontColor') || 'black',
        fontSize: (fntSize) ? fntSize : (styles['font-size']) ? styles['font-size'] : '14px',
        borderWidth: getNumbericAttribute(thisElement, 'borderWidth', 2),
        text: thisElement.textContent,
        isLeft: getBooleanAttribute(thisElement, 'isLeft')
    } as RenderAttributes
}

/** return a boolean attribute value from an HTML tag */
function getBooleanAttribute(thisElement: HTMLElement, name: string) {
    const boolResult = thisElement.getAttribute(name)
    return (boolResult === "false" || boolResult === null) ? false : true;
}

/** return a numeric attribute value from an HTML tag */
function getNumbericAttribute(thisElement: HTMLElement, name: string, defaultNumber: number = 0) {
    const val = thisElement.getAttribute(name)
    return (val) ? parseInt(val) : defaultNumber
}

/** return a string attribute value or null from an HTML tag */
function getStringAttribute(thisElement: HTMLElement, name: string) {
    return thisElement.getAttribute(name)
}

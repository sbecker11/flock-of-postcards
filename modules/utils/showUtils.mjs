// modules/utils/showUtils.mjs


export function showPosition(position, prefix="") {
    console.log(prefix, JSON.stringify(position, formatNumbersReplacer, 2));
}

export function showElement(element, prefix="", logLevel=LogLevel.LOG) {
    prefix = "showElement" + prefix + ":";

    if (element == null) {
        logger.warn(`${prefix} given null element`);
        return;
    }
    if (!this.isElement(element)) {
        logger.warn(`${prefix} given non-element object:${element}`);
        return;
    }
    if (element.id == null) {
        logger.warn(`${prefix} given element with no id:${element}`);
        return;
    }
    // now construct the elementInfo object
    const parentElementId = (element.parentElement != null) ? element.parentElement.id : "";
    let nextSiblingId = null;
    if (isAnyCardDiv(element)) {
        const nextSibling = findNextSiblingWithClass(element, "skill-card-div");
        nextSiblingId = (nextSibling != null) ? nextSibling.id : "";
    } else if (isBizCardDiv(element)) {
        const nextSibling = findNextSiblingWithClass(element, "biz-card-div");
        nextSiblingId = (nextSibling != null) ? nextSibling.id : "";
    }
    const center = {
        x: element.offsetLeft + element.clientWidth / 2,
        y: element.offsetTop + element.clientHeight / 2
    }
    const dims = {
        width: element.clientWidth,
        height: element.clientHeight
    }
    const elementInfo = {
        tagname: element.tagName,
        id: element.id,
        parent_id: parentElementId,
        next_sibling_id: nextSiblingId,
        center: center,
        dims: dims,
        zIndex: element.style.zIndex,
        filter: element.style.filter,
        classList: element.classList
    }
    logger.logWithLevel(JSON.stringify(elementInfo, formatNumbersReplacer, 2), logLevel);
}


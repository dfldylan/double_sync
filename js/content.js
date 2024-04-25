var hover_element = null;
var pointer_clone = document.createElement("img");
pointer_clone.id = "double_sync_pointer";
pointer_clone.src = chrome.runtime.getURL("./images/arrow-pointer.png");
pointer_clone.style.position = "fixed";
pointer_clone.style.zIndex = 99999;
pointer_clone.style.left = "10px";
pointer_clone.style.top = "10px";
pointer_clone.style.display = "none";
document.body.appendChild(pointer_clone);

function getXPath(node) {
  var comp, comps = [];
  var parent = null;
  var xpath = '';
  var getPos = function (node) {
    var position = 1, curNode;
    if (node.nodeType == Node.ATTRIBUTE_NODE) {
      return null;
    }
    for (curNode = node.previousSibling; curNode; curNode = curNode.previousSibling) {
      if (curNode.nodeName == node.nodeName) {
        ++position;
      }
    }
    return position;
  }

  if (node instanceof Document) {
    return '/';
  }

  for (; node && !(node instanceof Document); node = node.nodeType == Node.ATTRIBUTE_NODE ? node.ownerElement : node.parentNode) {
    comp = comps[comps.length] = {};
    switch (node.nodeType) {
      case Node.TEXT_NODE:
        comp.name = 'text()';
        break;
      case Node.ATTRIBUTE_NODE:
        comp.name = '@' + node.nodeName;
        break;
      case Node.PROCESSING_INSTRUCTION_NODE:
        comp.name = 'processing-instruction()';
        break;
      case Node.COMMENT_NODE:
        comp.name = 'comment()';
        break;
      case Node.ELEMENT_NODE:
        comp.name = node.nodeName;
        break;
    }
    comp.position = getPos(node);
  }

  for (var i = comps.length - 1; i >= 0; i--) {
    comp = comps[i];
    xpath += '/' + comp.name;
    if (comp.position != null) {
      xpath += '[' + comp.position + ']';
    }
  }

  return xpath;
}

function getElementByXpath(path) {
  return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

window.addEventListener("focus", function (event) {
  if (hover_element) {
    hover_element.classList.remove("__hover_highlight__qcr");
  }
});

document.addEventListener('click', function (e) {
  e = e || window.event;
  var target = e.target;

}, false);

document.addEventListener("mouseover", function (e) {
  let t = e.target;
  // console.log("hover element", t.nodeName);
  let x_path = getXPath(t);
  if (t.nodeName !== "TABLE" && t.nodeName !== "HTML" && t.nodeName !== "BODY" && t.nodeName !== "IMG") {
    chrome.runtime.sendMessage({ event: "mouseover", url: window.location.href, xpath: x_path });
  }
});

window.addEventListener('scroll', function (e) {
  if (pointer_clone.style.display == "none") {
    let t = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2); // 假设鼠标在屏幕中心
    let rect = t.getBoundingClientRect();
    let offset = rect.top + rect.height / 2;
    let x_path = getXPath(t);
    console.log("Offset:", offset, "NodeName", t.nodeName);
    chrome.runtime.sendMessage({ event: "scroll", url: window.location.href, xpath: x_path, offset: offset });
  }
});

window.addEventListener('mousemove', function (e) {
  pointer_clone.style.display = "none";
  chrome.runtime.sendMessage({ event: "mousemove", url: window.location.href, client_x: e.clientX, client_y: e.clientY });
});

function scrollTo(element, offset0) {
  const rect = element.getBoundingClientRect();
  const offset = offset0 - (rect.top + rect.height / 2);
  console.log("Scrolling to center of element:", element, "scrollTo:", window.scrollY + offset);
  window.scrollTo(0, window.scrollY + offset);
}
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    pointer_clone.style.display = "block";
    if (request.event == "scroll") {
      const element = getElementByXpath(request.xpath); // 使用您现有的getElementByXpath函数
      scrollTo(element, request.offset);
    } else if (request.event == "mousemove") {
      pointer_clone.style.left = "" + request.client_x + "px";
      pointer_clone.style.top = "" + request.client_y + "px";
      console.log("Force set pointer positoin");
    } else if (request.event == "mouseover") {
      if (hover_element) {
        hover_element.classList.remove("__hover_highlight__qcr");
      }
      let hover_e = getElementByXpath(request.xpath);
      hover_e.classList.add("__hover_highlight__qcr");
      hover_element = hover_e;
    }

    sendResponse();
  }
);
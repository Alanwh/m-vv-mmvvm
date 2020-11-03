function Vue(options = {}) {
  this.$options = options
  this._data = this.$options.data

  let data = this._data
  
  // 数据劫持
  observe(data)

  // 数据代理
  for(let key in data) {
    Object.defineProperty(this, key, {
      enumerable: true,
      get() {
        return this._data[key]
      },
      set(newVal) {
        this._data[key] = newVal
      }
    })
  }

  new Compile(options.el, this)
}

function observe(data) {
  if(typeof data !== 'object') return
  return new Observe(data)
}

/**
 * vue不能新增不存在的属性，没有 get 和 set
 * 深度响应，因为每次赋予一个新对象，会给新对象增加数据劫持
 */

function Observe(data) {
  for(let key in data) {
    let val = data[key]
    observe(val)
    Object.defineProperty(data, key, {
      enumerable: true,
      get() {
        return val
      },
      set(newVal) {
        if (newVal === val) return;
        val = newVal
        observe(val)
      }
    })
  }
}

function Compile(el, vm){
  vm.$el = document.querySelector(el)
  let fragment = document.createDocumentFragment()
  while(child = vm.$el.firstChild) {
    fragment.appendChild(child)
  }

  replace(fragment)

  function replace(fragment) {
    Array.from(fragment.childNodes).forEach(node => {
      let text = node.textContent
      let reg = /\{\{(.*)\}\}/
      if (node.nodeType === 3 && reg.test(text)) {
        let arr = RegExp.$1.split('.') // [a, a] [b]
        let val = vm
        arr.forEach(k => {
          val = val[k]
        })
        node.textContent = text.replace(reg, val)
      }
      if(node.childNodes) {
        replace(node)
      }
    })
  }

  vm.$el.appendChild(fragment)
}
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
  if (!data || typeof data !== 'object') return;
  return new Observe(data)
}

// vue不能新增不存在的属性，没有 get 和 set
// 深度响应，因为每次赋予一个新对象，会给新对象增加数据劫持

function Observe(data) {
  let dep = new Dep()
  // data 属性通过 Object.defineProperty 定义
  for(let key in data) {
    let val = data[key]
    observe(val)
    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: true,
      get() {
        Dep.target && dep.addSub(Dep.target) // [watch]
        return val
      },
      set(newVal) {
        if (newVal === val) return;
        val = newVal
        observe(val)
        dep.notify()
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
      // 1:元素节点 3: 文本节点
      if (node.nodeType === 3 && reg.test(text)) {
        let arr = RegExp.$1.split('.') // [a, a] [b]
        let val = vm
        arr.forEach(k => {
          val = val[k]
        })
        node.textContent = text.replace(reg, val)
        new Watcher(vm, RegExp.$1, function(newVal) {
          node.textContent = text.replace(reg, newVal)
        })
      }
      if (node.nodeType === 1) {
        let nodeAttrs = node.attributes
        Array.from(nodeAttrs).forEach((attr) => {
          let name = attr.name
          let exp = attr.value
          // 默认v-model
          if(name.includes('v-')) {
            node.value = vm[exp]
          }
          new Watcher(vm, exp, (newVal) => {
            node.value = newVal
          })
          node.addEventListener('input', (e) => {
            let newVal = e.target.value
            vm[exp] = newVal
          })
        })
      }
      if(node.childNodes) {
        replace(node)
      }
    })
  }

  vm.$el.appendChild(fragment)
}

function Dep() {
  this.subs = []
}

Dep.prototype.addSub = function(sub) {
  this.subs.push(sub)
}

Dep.prototype.notify = function() {
  this.subs.forEach(sub => sub.update())
}

function Watcher(vm, exp, fn) {
 this.fn = fn
 this.vm = vm
 this.exp = exp
 // watch 添加到订阅者
 Dep.target = this
 let val = vm
 let arr = exp.split('.')
 arr.forEach((k) => {
  val = val[k]
 })
 Dep.target = null
}

Watcher.prototype.update = function () {
  let val = this.vm
  let arr = this.exp.split('.')
  arr.forEach((k) => {
    val = val[k]
  })
  this.fn(val)
}
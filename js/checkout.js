(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const money = n => new Intl.NumberFormat("en-IN", {style:"currency", currency:"INR", maximumFractionDigits:0}).format(n);
  const PRIMARY_CART_KEY = "ehomelyCart"; // The menu page writes this key; it is the source of truth.
  const STORAGE_CART_KEYS = [PRIMARY_CART_KEY, "eHomelyCart", "cart", "phase3Cart", "e-homely-cart"];
  const STORAGE_ORDER_KEY = "eHomelyLastOrder";
  const businessSchedule = [
    { open: 7 * 60, close: 11 * 60 },
    { open: 12 * 60, close: 14 * 60 + 30 },
    { open: 19 * 60, close: 22 * 60 }
  ];
  const currentTime = new Date();
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const siteOpenNow = businessSchedule.some(slot => currentMinutes >= slot.open && currentMinutes < slot.close);
  const CART_BUSINESS_DATE_KEY = "ehomelyCartBusinessDate";
  const todayBusinessDate = currentTime.toLocaleDateString("en-CA");
  try {
    const savedBusinessDate = localStorage.getItem(CART_BUSINESS_DATE_KEY);
    if (savedBusinessDate && savedBusinessDate !== todayBusinessDate) {
      [...STORAGE_CART_KEYS, "ehomelyCartTotal"].forEach(key => localStorage.removeItem(key));
    }
    localStorage.setItem(CART_BUSINESS_DATE_KEY, todayBusinessDate);
    if (!siteOpenNow) [...STORAGE_CART_KEYS, "ehomelyCartTotal"].forEach(key => localStorage.removeItem(key));
  } catch (_) {}
  // Checkout lives in /pages, so image URLs use the same relative paths as menu cards.
  const FOOD_IMAGES = {
    "puttu": "../assets/food/Puttu.png",
    "appam": "../assets/food/Appam.png",
    "idiyappam": "../assets/food/Idiyappam.png",
    "dosa": "../assets/food/Dosa.png",
    "kadala curry": "../assets/food/Kadala curry.png",
    "chappathi": "../assets/food/Chappathi.png",
    "egg roast": "../assets/food/Egg roast.png",
    "boiled egg": "../assets/food/Boiled egg.png",
    "rice": "../assets/food/Rice.png",
    "sambar": "../assets/food/Sambar.png",
    "rasam": "../assets/food/Rasam.png",
    "avial": "../assets/food/avial.png",
    "erissery": "../assets/food/Erissery.png",
    "kerala fish curry": "../assets/food/Fish curry.png",
    "fish curry": "../assets/food/Fish curry.png",
    "biriyani": "../assets/food/Biriyani.png",
    "chicken fry": "../assets/food/Chicken fry.png",
    "stew": "../assets/food/Stew.png",
    "chicken curry": "../assets/food/Chicken curry.png"
  };
  const imageForItem = item => item.image || item.img || item.imageUrl || FOOD_IMAGES[String(item.name || "").trim().toLowerCase()] || "../assets/food/food-placeholder.jpg";
  let cart = readCart();
  let mode = "eat";
  let order = null;
  let timerInterval = null;
  let deadline = null;
  let hasConfirmedOrder = false;

  function normalizeCartValue(parsed) {
    const arr = Array.isArray(parsed) ? parsed : (parsed && (parsed.items || parsed.cart || parsed.cartItems)) || [];
    if (!Array.isArray(arr)) return null;
    return arr.map((x, i) => {
      if (!x || typeof x !== "object") return null;
      const name = String(x.name ?? x.title ?? x.food ?? "").trim();
      const price = Number(x.price ?? x.amount ?? x.unitPrice);
      const qty = Number(x.qty ?? x.quantity ?? x.count ?? 1);
      if (!name || !Number.isFinite(price) || price < 0 || !Number.isFinite(qty) || qty <= 0) return null;
      return {
        id: String(x.id ?? name ?? i), name, price, qty: Math.floor(qty),
        image: imageForItem(x),
        category: x.category || ""
      };
    }).filter(Boolean);
  }
  function readCart() {
    // The menu page stores the live cart in `ehomelyCart`. Older versions may
    // leave a stale `eHomelyCart` key behind, so never let that override it.
    try {
      const primary = localStorage.getItem(PRIMARY_CART_KEY);
      if (primary !== null) {
        const normalized = normalizeCartValue(JSON.parse(primary));
        if (normalized !== null) return normalized;
      }
    } catch (_) {}

    // Backward compatibility: use the first non-empty valid legacy cart.
    for (const key of STORAGE_CART_KEYS.slice(1)) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const normalized = normalizeCartValue(JSON.parse(raw));
        if (normalized && normalized.length) return normalized;
      } catch (_) {}
    }
    return [];
  }
  function saveCart() {
    // Keep both quantity fields so the existing E-HOMELY menu page can read the cart.
    const compatibleCart = cart.map(item => ({ ...item, quantity: item.qty }));
    try { localStorage.setItem(CART_BUSINESS_DATE_KEY, new Date().toLocaleDateString("en-CA")); } catch (_) {}
    try { localStorage.setItem("eHomelyCart", JSON.stringify(compatibleCart)); } catch (_) {}
    for (const key of STORAGE_CART_KEYS) {
      try {
        if (localStorage.getItem(key) !== null) {
          localStorage.setItem(key, JSON.stringify(compatibleCart));
        }
      } catch (_) {}
    }
  }
  function totalQty() { return cart.reduce((sum,x)=>sum+x.qty,0); }
  function totalPrice() { return cart.reduce((sum,x)=>sum+x.qty*x.price,0); }
  function toast(message) {
    const el=$("#toast"); el.textContent=message; el.classList.add("show");
    clearTimeout(toast._timer); toast._timer=setTimeout(()=>el.classList.remove("show"),2600);
  }
  function renderCart() {
    const wrap=$("#cartItems"); wrap.innerHTML="";
    $("#emptyNote").hidden=cart.length>0;
    $("#addDemoItem").hidden=cart.length>0;
    cart.forEach(item=>{
      const row=document.createElement("div"); row.className="cart-row";
      const thumb=document.createElement("div"); thumb.className="dish-thumb";
      const img=document.createElement("img");
      img.src=item.image || imageForItem(item);
      img.alt=item.name;
      img.loading="lazy";
      img.onerror=()=>{ if (!img.dataset.fallback) { img.dataset.fallback="1"; img.src="../assets/food/food-placeholder.jpg"; } else { img.remove(); } };
      thumb.append(img);
      const info=document.createElement("div");info.className="dish-info";
      const name=document.createElement("strong");name.textContent=item.name;
      const unit=document.createElement("small");unit.textContent=money(item.price)+" each";
      const controls=document.createElement("div");controls.className="qty-control";
      const minus=document.createElement("button");minus.type="button";minus.textContent="−";minus.setAttribute("aria-label","Decrease "+item.name);
      const qty=document.createElement("span");qty.textContent=item.qty;
      const plus=document.createElement("button");plus.type="button";plus.textContent="+";plus.setAttribute("aria-label","Increase "+item.name);
      minus.onclick=()=>changeQty(item.id,-1);plus.onclick=()=>changeQty(item.id,1);
      controls.append(minus,qty,plus);info.append(name,unit,controls);
      const price=document.createElement("strong");price.className="dish-price";price.textContent=money(item.price*item.qty);
      row.append(thumb,info,price);wrap.append(row);
    });
    $("#itemCount").textContent=`${totalQty()} item${totalQty()===1?"":"s"}`;
    $("#subtotal").textContent=money(totalPrice());$("#total").textContent=money(totalPrice());
    $("#placeOrder").disabled=cart.length===0;
    $("#placeOrder").style.opacity=cart.length===0?".55":"1";
  }
  function changeQty(id,delta) {
    const item=cart.find(x=>x.id===id);if(!item)return;
    item.qty+=delta;if(item.qty<=0)cart=cart.filter(x=>x.id!==id);
    saveCart();renderCart();
  }
  $$(".fulfilment-card").forEach(btn=>btn.addEventListener("click",()=>{
    mode=btn.dataset.mode;$$(".fulfilment-card").forEach(x=>x.classList.toggle("selected",x===btn));
  }));
  $("#customerPhone").addEventListener("input",e=>{e.target.value=e.target.value.replace(/\D/g,"").slice(0,10);e.target.classList.remove("invalid");$("#phoneError").textContent=""});
  $("#customerName").addEventListener("input",e=>{e.target.classList.remove("invalid");$("#nameError").textContent=""});
  $("#addDemoItem").addEventListener("click",()=>{ if (window.history.length > 1) window.history.back(); else window.location.href = "menu.html"; });
  function validate() {
    let valid=true;
    const name=$("#customerName").value.trim(),phone=$("#customerPhone").value.trim();
    if(name.length<2){$("#customerName").classList.add("invalid");$("#nameError").textContent="Please enter your name.";valid=false}
    if(!/^\d{10}$/.test(phone)){$("#customerPhone").classList.add("invalid");$("#phoneError").textContent="Enter exactly 10 digits.";valid=false}
    if(!cart.length){toast("Your cart is empty. Add a dish before confirming.");valid=false}
    return valid;
  }
  function createToken() {
    const prefix=mode==="eat"?"EAT":"TAK";
    let seq=1;
    try{seq=Number(localStorage.getItem("eHomelyTokenSequence")||0)+1;localStorage.setItem("eHomelyTokenSequence",String(seq))}catch(_){}
    return `${prefix}-${String(seq).padStart(4,"0")}`;
  }
  function showView(view) {
    // Keep every stage on this page. Before a valid order is confirmed,
    // confirmation and token remain hidden (and cannot be scrolled into).
    $("#checkoutView").hidden = false;
    $("#confirmationView").hidden = !hasConfirmedOrder;
    $("#tokenView").hidden = !hasConfirmedOrder;

    $("#pageTitle").innerHTML = view === "checkout" ? 'E-HOMELY' : view === "confirmation" ? 'Order <em>received.</em>' : 'Your little piece<br>of <em>homely.</em>';
    $("#pageSubtitle").textContent = view === "checkout" ? "A few details, then we’ll get your order ready." : view === "confirmation" ? "Your meal is one step closer. Keep your token details handy." : "Keep this token safe and show it at the counter.";
    $("#step1").classList.toggle("active", view === "checkout");
    $("#step1").classList.toggle("done", hasConfirmedOrder);
    $("#step2").classList.toggle("active", view === "confirmation");
    $("#step2").classList.toggle("done", view === "token");
    $("#step3").classList.toggle("active", view === "token");

    const target = view === "checkout" ? $("#checkoutView") : view === "confirmation" ? $("#confirmationView") : $("#tokenView");
    // Scroll within this page rather than switching/hiding to another page.
    requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  $("#placeOrder").addEventListener("click",()=>{
    if(!validate()){const bad=$(".invalid");if(bad)bad.focus();return}
    order={token:createToken(),name:$("#customerName").value.trim(),phone:$("#customerPhone").value.trim(),mode,items:cart.map(x=>({...x})),total:totalPrice(),status:"Confirmed",createdAt:new Date().toISOString()};
    hasConfirmedOrder = true;
    deadline=Date.now()+20*60*1000;
    try{localStorage.setItem(STORAGE_ORDER_KEY,JSON.stringify(order))}catch(_){}
    // The confirmed order keeps its own item snapshot; clear the shopping cart for the next visit.
    cart = [];
    [...STORAGE_CART_KEYS, "ehomelyCartTotal"].forEach(key => { try { localStorage.removeItem(key); } catch (_) {} });
    renderCart();
    $("#confirmToken").textContent=order.token;$("#confirmStatus").textContent=order.status;$("#confirmTotal").textContent=money(order.total);
    const ci=$("#confirmItems");ci.innerHTML="";
    order.items.forEach(x=>{const row=document.createElement("div");row.className="confirm-item";const a=document.createElement("span");a.textContent=`${x.qty} × ${x.name}`;const b=document.createElement("strong");b.textContent=money(x.qty*x.price);row.append(a,b);ci.append(row)});
    // Populate the token immediately so manual scrolling works just like the button.
    renderToken();
    showView("confirmation");
    startTimer();
  });
  $("#viewToken").addEventListener("click",()=>{renderToken();showView("token")});
  $("#backToCheckout").addEventListener("click",()=>showView("checkout"));
  $("#returnHome").addEventListener("click",()=>{showView("checkout");toast("Your token remains saved in this browser.")});
  function renderToken() {
    if(!order)return;
    $("#tokenModeLabel").textContent=order.mode==="eat"?"EAT HERE":"COLLECT";
    $("#tokenNumber").textContent=order.token;$("#tokenCustomer").textContent=order.name;$("#tokenStatus").textContent=order.status;$("#tokenTotal").textContent=money(order.total);
    $("#tokenDate").textContent=new Date(order.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
    const wrap=$("#tokenItems");wrap.innerHTML="";
    order.items.forEach(x=>{const row=document.createElement("div");row.className="token-item";const a=document.createElement("span");a.textContent=`${x.qty} × ${x.name}`;const b=document.createElement("strong");b.textContent=money(x.qty*x.price);row.append(a,b);wrap.append(row)});
      $("#confirmStatus").textContent=order.status;
  }
  function startTimer() {
    clearInterval(timerInterval);
    if(!deadline)deadline=Date.now()+20*60*1000;
    const tick=()=>{
      const left=Math.max(0,deadline-Date.now()),m=Math.floor(left/60000),s=Math.floor((left%60000)/1000);
      $("#countdown").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
      if(left<=0){$("#timerMessage").textContent="Your 20-minute window has ended.";clearInterval(timerInterval)}
      if(order?.status==="Collected"){$("#timerMessage").textContent="Order collected. Enjoy your meal!";clearInterval(timerInterval)}
      if(order?.status==="Cancelled"){$("#timerMessage").textContent="This order has been cancelled.";clearInterval(timerInterval)}
    };tick();timerInterval=setInterval(tick,1000);
  }
  async function saveTokenPng() {
    if(!order)return;
    const scale=2,w=900,pad=54;
    const lines=order.items.map(x=>`${x.qty} × ${x.name}   ${money(x.qty*x.price)}`);
    const h=1050+Math.max(0,lines.length-2)*42;
    const canvas=document.createElement("canvas");canvas.width=w*scale;canvas.height=h*scale;
    const ctx=canvas.getContext("2d");ctx.scale(scale,scale);
    ctx.fillStyle="#f7f3ea";ctx.fillRect(0,0,w,h);
    ctx.fillStyle="#fffdf8";roundRect(ctx,32,32,w-64,h-64,28);ctx.fill();
    ctx.strokeStyle="#e5dfd3";ctx.lineWidth=2;roundRect(ctx,32,32,w-64,h-64,28);ctx.stroke();
    ctx.fillStyle="#2b2924";ctx.font="700 22px Arial";ctx.textAlign="center";ctx.fillText("E-HOMELY",w/2,78);
    // Use the same uploaded E-HOMELY logo shown on the website token.
    try {
      const logo = new Image();
      logo.src = "../assets/images/Ehomely.png";
      await new Promise((resolve, reject) => { logo.onload = resolve; logo.onerror = reject; });
      ctx.drawImage(logo,w/2-76,91,152,152);
    } catch (_) {
      ctx.fillStyle="#34583d";ctx.beginPath();ctx.arc(w/2,167,60,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#fffdf8";ctx.font="italic 72px Georgia";ctx.fillText("e",w/2,190);
    }
    ctx.fillStyle="#34583d";ctx.font="700 18px Arial";ctx.fillText(order.mode==="eat"?"EAT HERE":"COLLECT",w/2,270);
    ctx.fillStyle="#77736b";ctx.font="700 17px Arial";ctx.fillText("YOUR ORDER TOKEN",w/2,325);
    ctx.fillStyle="#34583d";ctx.font="700 56px Arial";ctx.fillText(order.token,w/2,397);
    ctx.strokeStyle="#d7d0c2";ctx.setLineDash([7,7]);ctx.beginPath();ctx.moveTo(pad,440);ctx.lineTo(w-pad,440);ctx.stroke();ctx.setLineDash([]);
    ctx.textAlign="left";ctx.fillStyle="#77736b";ctx.font="700 15px Arial";ctx.fillText("ORDER FOR",pad,490);ctx.fillText("STATUS",w/2+15,490);
    ctx.fillStyle="#2b2924";ctx.font="600 24px Arial";ctx.fillText(order.name.slice(0,28),pad,527);ctx.fillText(order.status,w/2+15,527);
    let y=590;ctx.fillStyle="#77736b";ctx.font="700 15px Arial";ctx.fillText("YOUR ITEMS",pad,y);y+=30;
    ctx.fillStyle="#2b2924";ctx.font="20px Arial";
    lines.forEach(line=>{ctx.fillText(line.slice(0,50),pad,y);y+=42});
    y+=12;ctx.strokeStyle="#e5dfd3";ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(w-pad,y);ctx.stroke();y+=48;
    ctx.fillStyle="#77736b";ctx.font="700 17px Arial";ctx.fillText("TOTAL",pad,y);
    ctx.textAlign="right";ctx.fillStyle="#34583d";ctx.font="700 32px Arial";ctx.fillText(money(order.total),w-pad,y+4);
    y+=70;ctx.textAlign="center";ctx.fillStyle="#77736b";ctx.font="14px Arial";ctx.fillText("GOOD FOOD  ·  GOOD COMPANY  ·  BETTER DAYS",w/2,y);
    ctx.font="13px Arial";ctx.fillText(new Date(order.createdAt).toLocaleString("en-IN"),w/2,y+28);
    const a=document.createElement("a");a.download=`E-HOMELY-${order.token}.png`;a.href=canvas.toDataURL("image/png");a.click();
    toast("Your token PNG is ready to save.");
  }
  function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
  $("#savePng").addEventListener("click",saveTokenPng);
  renderCart();
})();
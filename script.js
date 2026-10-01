// ===== CONFIGURACIÓN GLOBAL =====
let cart = JSON.parse(localStorage.getItem('cart_luna')) || [];
const PHONE_NUMBER = "50376609138";

// ===== EVENTOS AL CARGAR LA PÁGINA =====
document.addEventListener('DOMContentLoaded', () => {
    initQuantityControls();
    initAddToCartButtons();
    initCartModal();
    updateCartUI();
});

// Control del Splash Screen (Se muestra únicamente 1 vez por sesión)
window.addEventListener('load', () => {
    const splash = document.getElementById('splashScreen');
    if (!splash) return;

    if (sessionStorage.getItem('splashShown')) {
        splash.style.display = 'none';
    } else {
        setTimeout(() => {
            splash.classList.add('hidden');
            sessionStorage.setItem('splashShown', 'true');
        }, 1000);
    }
});

// ===== NAVEGACIÓN Y ANIMACIONES DE SCROLL =====
function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('active');
}

document.querySelectorAll('#navMenu a').forEach(link => {
    link.addEventListener('click', () => {
        const navMenu = document.getElementById('navMenu');
        if (navMenu) navMenu.classList.remove('active');
    });
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ===== LÓGICA DEL CARRITO =====

function saveCartToStorage() {
    localStorage.setItem('cart_luna', JSON.stringify(cart));
}

// 1. Controles de cantidad (+ y -) en el catálogo
function initQuantityControls() {
    document.querySelectorAll('.quantity-selector').forEach(selector => {
        const decBtn = selector.querySelector('.decrease');
        const incBtn = selector.querySelector('.increase');
        const input = selector.querySelector('.qty-input');

        if (decBtn && incBtn && input) {
            decBtn.addEventListener('click', () => {
                let val = parseInt(input.value) || 1;
                if (val > 1) input.value = val - 1;
            });

            incBtn.addEventListener('click', () => {
                let val = parseInt(input.value) || 1;
                input.value = val + 1;
            });
        }
    });
}

// 2. Agregar productos al carrito
function initAddToCartButtons() {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            
            const title = card.dataset.title || card.querySelector('.product-title').innerText;
            
            let price = parseFloat(card.dataset.price);
            if (isNaN(price)) {
                const priceText = card.querySelector('.product-price').innerText;
                const match = priceText.match(/\d+(\.\d+)?/);
                price = match ? parseFloat(match[0]) : 0;
            }

            const quantityInput = card.querySelector('.qty-input');
            const quantity = parseInt(quantityInput.value) || 1;

            addToCart(title, price, quantity);
            
            const originalText = btn.innerText;
            btn.innerText = '¡Agregado! ☕';
            btn.classList.add('added');

            setTimeout(() => {
                btn.innerText = originalText;
                btn.classList.remove('added');
            }, 1200);

            quantityInput.value = 1;
        });
    });
}

function addToCart(title, price, quantity) {
    price = Number(price) || 0;
    quantity = Number(quantity) || 1;

    const existingItem = cart.find(item => item.title === title);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ title, price, quantity });
    }

    updateCartUI();
}

// 3. Modificar cantidad (+ / -) dentro del modal
function changeCartQuantity(index, delta) {
    if (!cart[index]) return;

    cart[index].quantity += delta;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    updateCartUI();
}

// 4. Renderizar productos, calcular total y actualizar UI
function updateCartUI() {
    saveCartToStorage();

    const cartCount = document.getElementById('cartCount');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');

    const totalBadgeCount = cart.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
    if (cartCount) cartCount.innerText = totalBadgeCount;

    if (!cartItemsContainer || !cartTotalElement) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="cart-empty">Tu carrito está vacío ☕</p>';
        cartTotalElement.innerText = '$0.00';
        return;
    }

    let itemsHTML = '';
    let grandTotal = 0;

    cart.forEach((item, index) => {
        const itemPrice = Number(item.price) || 0;
        const itemQty = Number(item.quantity) || 0;

        const itemSubtotal = Math.round(itemPrice * itemQty * 100) / 100;
        grandTotal = Math.round((grandTotal + itemSubtotal) * 100) / 100;

        itemsHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.title}</h4>
                    <p>$${itemPrice.toFixed(2)} c/u — Total: <strong>$${itemSubtotal.toFixed(2)}</strong></p>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-selector cart-qty">
                        <button type="button" onclick="changeCartQuantity(${index}, -1)" class="qty-btn">-</button>
                        <span class="qty-value">${itemQty}</span>
                        <button type="button" onclick="changeCartQuantity(${index}, 1)" class="qty-btn">+</button>
                    </div>
                    <button type="button" onclick="removeFromCart(${index})" class="cart-remove-btn" title="Eliminar producto">🗑️</button>
                </div>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = itemsHTML;
    cartTotalElement.innerText = `$${grandTotal.toFixed(2)}`;
}

// 5. Eliminar un producto del carrito
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// 6. Apertura y cierre del modal
function initCartModal() {
    const cartBtn = document.querySelector('.cart-icon-btn');
    const closeBtn = document.getElementById('closeCartBtn');
    const cartOverlay = document.getElementById('cartOverlay');

    if (cartBtn) cartBtn.addEventListener('click', () => toggleCartModal(true));
    if (closeBtn) closeBtn.addEventListener('click', () => toggleCartModal(false));
    if (cartOverlay) {
        cartOverlay.addEventListener('click', (e) => {
            if (e.target === cartOverlay) toggleCartModal(false);
        });
    }
}

function toggleCartModal(show) {
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartOverlay) {
        if (show) {
            cartOverlay.classList.add('active');
        } else {
            cartOverlay.classList.remove('active');
        }
    }
}

// 7. Enviar orden directa a WhatsApp
function handleCheckout(e) {
    e.preventDefault();

    if (cart.length === 0) {
        alert('Agrega al menos un producto antes de proceder con la compra.');
        return;
    }

    const nameInput = document.getElementById('checkoutName');
    const locationInput = document.getElementById('checkoutLocation');

    const name = nameInput ? nameInput.value.trim() : '';
    const location = locationInput ? locationInput.value.trim() : '';

    if (!name || !location) {
        alert('Por favor ingresa tu nombre y ubicación para la entrega.');
        return;
    }

    let grandTotal = 0;
    let orderList = '';

    cart.forEach(item => {
        const itemPrice = Number(item.price) || 0;
        const itemQty = Number(item.quantity) || 0;
        const itemSubtotal = Math.round(itemPrice * itemQty * 100) / 100;
        grandTotal = Math.round((grandTotal + itemSubtotal) * 100) / 100;

        orderList += `- ${itemQty}x ${item.title} ($${itemSubtotal.toFixed(2)})\n`;
    });

    const message = `hola CAFE LUNA
esta es mi orden quiero proceder con la compra

Nombre: ${name}
Ubicación: ${location}

Detalle del pedido:
${orderList}
Total a pagar: $${grandTotal.toFixed(2)}`;

    const whatsappURL = `https://api.whatsapp.com/send?phone=${PHONE_NUMBER}&text=${encodeURIComponent(message)}`;
    
    window.open(whatsappURL, '_blank');

    cart = [];
    updateCartUI();
}
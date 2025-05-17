const SPREADSHEET_ID = '1m4gOfjsCO-4bKou6Er_tTMJSpx4nUgu0qWaMIGYgO1M';
const SHEET_NAME = 'Produtos'; // Nome correto da aba
const API_KEY = 'AIzaSyDsCagR6kJ8xW_RHJPEOCfh3-FS1iazDss';

// Elementos DOM
const productsContainer = document.getElementById('products-container');
const loadingIndicator = document.createElement('div');
loadingIndicator.className = 'loading-indicator';
loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando produtos...';

// Variáveis de controle
let isLoading = false;
let hasLoaded = false;

// Função para converter URLs do Imgur para links diretos de imagem com extensão automática
function convertImgurUrl(url) {
    url = url.trim();

    const regex = /^https?:\/\/imgur\.com\/([a-zA-Z0-9]+)(\.(jpg|jpeg|png|gif))?$/i;
    const match = url.match(regex);

    if (match) {
        const id = match[1];
        const ext = match[3] ? match[3].toLowerCase() : 'jpg';
        return `https://i.imgur.com/${id}.${ext}`;
    }

    return url;
}

// Função para carregar os dados da planilha (SEM cache)
async function loadProductsFromSheet() {
    if (isLoading) {
        console.log('Carregamento já em andamento, ignorando nova requisição');
        return;
    }
    
    if (hasLoaded) {
        console.log('Produtos já carregados anteriormente, ignorando nova requisição');
        return;
    }
    
    isLoading = true;
    
    try {
        productsContainer.innerHTML = '';
        productsContainer.appendChild(loadingIndicator);
        
        console.log('Fazendo requisição à API do Google Sheets...');
        
        const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (!data.values || data.values.length <= 1) {
            throw new Error('Nenhum dado encontrado na planilha');
        }
        
        displayProducts(data);
        hasLoaded = true;
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        productsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Não foi possível carregar os produtos. Por favor, tente novamente mais tarde.</p>
            </div>
        `;
    } finally {
        isLoading = false;
    }
}

// Função para processar e exibir os produtos
function displayProducts(data) {
    if (productsContainer.contains(loadingIndicator)) {
        productsContainer.removeChild(loadingIndicator);
    }
    
    const headers = data.values[0];
    
    const descriptionIndex = headers.findIndex(header => header.toLowerCase().includes('descrição'));
    const priceIndex = headers.findIndex(header => header.toLowerCase().includes('preço avista'));
    const cardPriceIndex = headers.findIndex(header => header.toLowerCase().includes('preço cartão'));
    const imageIndex = headers.findIndex(header => header.toLowerCase().includes('imagem'));
    const availabilityIndex = headers.findIndex(header => header.toLowerCase().includes('disponível'));
    const nameIndex = headers.findIndex(header => header.toLowerCase().includes('nome'));
    
    if (descriptionIndex === -1 || priceIndex === -1 || imageIndex === -1 || 
        availabilityIndex === -1 || nameIndex === -1) {
        throw new Error('Colunas necessárias não encontradas na planilha');
    }
    
    for (let i = 1; i < data.values.length; i++) {
        const row = data.values[i];
        
        if (row.length <= Math.max(descriptionIndex, priceIndex, imageIndex, availabilityIndex)) {
            continue;
        }
        
        const name = row[nameIndex] || 'Sem nome';
        const description = row[descriptionIndex] || 'Sem descrição';
        const price = row[priceIndex] || '0,00';
        const cardPrice = row[cardPriceIndex] || price;
        const rawImageUrl = row[imageIndex] || '';
        const imageUrl = convertImgurUrl(rawImageUrl);
        const isAvailable = (row[availabilityIndex] || '').toLowerCase() === 'disponível';
        
        createProductCard(name, description, price, cardPrice, imageUrl, isAvailable);
    }
}

// Função para criar um card de produto
function createProductCard(name, description, price, cardPrice, imageUrl, isAvailable) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    
    if (!isAvailable) {
        productCard.classList.add('unavailable');
    }
    
    productCard.innerHTML = `
        <div class="product-image">
            <img src="${imageUrl}" alt="${name}" onerror="this.src='/static/images/placeholder.jpg'">
            ${!isAvailable ? '<div class="unavailable-badge">Indisponível</div>' : ''}
        </div>
        <div class="product-info">
            <h3>${name}</h3>
            <p>${description}</p>
            <div class="product-price">
                <div class="price-main">R$ ${price}</div>
                <div class="price-card">ou R$ ${cardPrice} no cartão</div>
            </div>
            <a href="#contact" class="btn ${!isAvailable ? 'btn-disabled' : ''}">
                ${isAvailable ? 'Saiba Mais' : 'Indisponível'}
            </a>
        </div>
    `;
    
    productsContainer.appendChild(productCard);
}

// Mobile Menu Toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const nav = document.querySelector('nav');
mobileMenuBtn.addEventListener('click', () => {
    nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
});

// Smooth Scrolling for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const headerHeight = document.querySelector('header').offsetHeight;
            const targetPosition = targetElement.offsetTop - headerHeight;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
            if (window.innerWidth <= 768) {
                nav.style.display = 'none';
            }
        }
    });
});

// Carregar produtos quando a página estiver pronta
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Carregado - Verificando se estamos na página de produtos');
    if (document.getElementById('products-container')) {
        console.log('Container de produtos encontrado - Iniciando carregamento...');
        loadProductsFromSheet();
    }
});

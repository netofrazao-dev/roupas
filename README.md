# 🛍️ Loja de Roupas Online — Site com HTML, CSS, JS e Supabase

## 📌 Visão Geral

Este projeto é um site profissional de e-commerce para uma loja de roupas, desenvolvido com foco em **alta conversão**, **design moderno (UI)** e **experiência do usuário (UX)** extremamente intuitiva.

A aplicação permite que clientes naveguem pelos produtos e realizem pedidos de forma simples e rápida via **WhatsApp**, enquanto o administrador possui controle total sobre o catálogo através de um painel integrado ao **Supabase**.

---

## 🎯 Objetivo

Criar uma plataforma leve, rápida e eficiente para venda de roupas online, eliminando fricções no processo de compra e facilitando o gerenciamento dos produtos.

---

## 🚀 Tecnologias Utilizadas

### Frontend

* HTML5
* CSS3
* JavaScript (Vanilla JS)

### Backend / Banco de Dados

* Supabase (Database, Auth e Storage)
* Fetch API para comunicação com o backend

---

## 🎨 UI/UX (Diferencial do Projeto)

* Design minimalista em preto e branco
* Layout limpo e sofisticado
* Navegação intuitiva (pensada para qualquer usuário)
* Microinterações e animações suaves
* Mobile-first (otimizado para celular)
* Jornada de compra em poucos cliques

---

## 🧩 Funcionalidades

### 👤 Para o Cliente

* Visualizar produtos com imagens e detalhes
* Filtrar por categoria, tamanho e preço
* Buscar produtos rapidamente
* Ver promoções e novidades
* Selecionar tamanho e quantidade
* Finalizar compra via WhatsApp com mensagem automática

---

### ⚙️ Para o Administrador

* Login seguro via Supabase
* Adicionar novos produtos
* Editar produtos existentes
* Remover produtos
* Gerenciar:

  * Preço
  * Promoções
  * Estoque
  * Tamanhos
  * Imagens

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

Tabela: `products`

| Campo       | Tipo       | Descrição             |
| ----------- | ---------- | --------------------- |
| id          | uuid       | Identificador único   |
| name        | text       | Nome do produto       |
| description | text       | Descrição             |
| price       | numeric    | Preço original        |
| promo_price | numeric    | Preço promocional     |
| sizes       | text/array | Tamanhos disponíveis  |
| stock       | integer    | Quantidade em estoque |
| image_url   | text       | URL da imagem         |
| category    | text       | Categoria             |
| created_at  | timestamp  | Data de criação       |

---

## 📲 Integração com WhatsApp

Ao clicar em “Comprar”, o usuário é redirecionado automaticamente para o WhatsApp com uma mensagem pré-preenchida contendo:

* Nome do produto
* Tamanho
* Quantidade
* Preço

---

## 📁 Estrutura do Projeto

```
/project
│
├── index.html
├── product.html
├── admin.html
│
├── /css
│   └── styles.css
│
├── /js
│   ├── app.js
│   ├── products.js
│   ├── admin.js
│   └── supabase.js
│
└── /assets
    └── images
```

---

## ⚡ Performance

* Código leve (sem frameworks)
* Carregamento rápido
* Otimização de imagens
* Estrutura eficiente

---

## 🔐 Segurança

* Autenticação via Supabase
* Proteção básica no painel admin
* Separação de responsabilidades frontend/backend

---

## 📌 Requisitos

* Navegador moderno
* Conta no Supabase
* Configuração de URL e API Key

---

## 🛠️ Possíveis Melhorias Futuras

* Sistema de carrinho completo
* Pagamento online (Pix, cartão)
* Avaliações de produtos
* Painel com métricas de vendas
* Sistema de cupons

---

## 📄 Licença

Este projeto pode ser utilizado para fins comerciais e personalizados conforme a necessidade do cliente.

---

## 👨‍💻 Autor

Projeto desenvolvido para criação de lojas modernas, rápidas e eficientes com foco em conversão e simplicidade.

---

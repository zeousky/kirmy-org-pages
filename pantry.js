const filter = document.querySelector('[data-filter]');
const ingredient = document.getElementById('ingredient');
const entries = document.querySelectorAll('.index-list li');
const result = document.querySelector('[data-result]');
const print = document.querySelector('[data-print]');

ingredient.addEventListener('change', () => {
  let count = 0;
  for (const entry of entries) {
    const matches = ingredient.value === 'all' || entry.dataset.ingredients.split(' ').includes(ingredient.value);
    entry.hidden = !matches;
    if (matches) count += 1;
  }
  result.textContent = count === 1 ? '1 recipe in the index' : count + ' recipes in the index';
});

print.addEventListener('click', () => window.print());
filter.hidden = false;
print.hidden = false;

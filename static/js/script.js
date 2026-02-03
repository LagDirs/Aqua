const aquariumData = {
    types: ['Пресноводный'],
    subtypes: ['Классический', 'Травник'],
    volumes: [10, 20, 30, 50, 60, 100, 200, 240, 300],
    plantDensity: ['Низкая', 'Средняя', 'Высокая'],
    plantComplexity: ['Лёгкие', 'Средние', 'Сложные']
};

document.addEventListener('DOMContentLoaded', function() {
    initializeDropdowns();
    setupEventListeners();
});

function initializeDropdowns() {
    populateSelect('aquarium-type', aquariumData.types);
    populateSelect('aquarium-subtype', aquariumData.subtypes);
    populateSelect('aquarium-volume', aquariumData.volumes);
    populateSelect('plant-density', aquariumData.plantDensity);
    populateSelect('plant-complexity', aquariumData.plantComplexity);
}

function populateSelect(selectId, items) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">-- Выберите --</option>';
    
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
    });
}

function setupEventListeners() {
    document.getElementById('aquarium-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmit();
    });

    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.value < 0) {
                this.value = 0;
            }
        });
    });
}


function handleFormSubmit() {
    const formData = {
        type: document.getElementById('aquarium-type').value,
        subtype: document.getElementById('aquarium-subtype').value,
        volume: parseInt(document.getElementById('aquarium-volume').value), 
        fish_small: parseInt(document.getElementById('fish-small').value) || 0,
        fish_medium: parseInt(document.getElementById('fish-medium').value) || 0,
        fish_large: parseInt(document.getElementById('fish-large').value) || 0,
        plant_density: document.getElementById('plant-density').value,
        plant_complexity: document.getElementById('plant-complexity').value
    };

    if (!formData.type || !formData.subtype || !formData.volume || 
        !formData.plant_density || !formData.plant_complexity) {
        showError('Пожалуйста, заполните все обязательные поля');
        return;
    }

    // Валидация количества рыб по объёму аквариума. Формула: маленькие × 2 + средние × 5 + большие × 30
    const requiredVolume = (formData.fish_small * 2) + (formData.fish_medium * 5) + (formData.fish_large * 30);
    
    if (requiredVolume > formData.volume) {
        const errorMessage = `Для такого количества рыб выбранный аквариум слишком мал. Уменьшите количество рыб! Минимальный объём аквариума для такого количества рыб: ${requiredVolume}л.`;
        showError(errorMessage);
        return;
    }

    displayResults(formData);
}

async function displayResults(formData) {
    const resultsSection = document.getElementById('results-section');
    const resultsContainer = document.getElementById('results-container');

    try {
        const params = new URLSearchParams();
        
        if (formData.volume) params.append('volume', formData.volume);
        if (formData.type) params.append('aquarium_type', formData.type);
        if (formData.subtype) params.append('aquarium_subtype', formData.subtype);
        if (formData.plant_complexity) params.append('plant_complexity', formData.plant_complexity);

        const response = await fetch(`/api/equipment?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const equipment = await response.json();
        const table = document.createElement('table');
        
        if (equipment.length === 0) {
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Название оборудования</th>
                        <th>Категория</th>
                        <th>Цена (руб.)</th>
                        <th>Описание</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 40px; color: #666;">
                            <p>По вашим параметрам оборудование не найдено</p>
                            <p style="font-size: 0.9rem; margin-top: 10px;">
                                Попробуйте изменить параметры выбора
                            </p>
                        </td>
                    </tr>
                </tbody>
            `;
        } else {
            const tableHeader = `
                <thead>
                    <tr>
                        <th>Название оборудования</th>
                        <th>Категория</th>
                        <th>Цена (руб.)</th>
                        <th>Мощность (Вт)</th>
                        <th>Объём (л.)</th>
                        <th>Описание</th>
                    </tr>
                </thead>
            `;

            const tableRows = equipment.map(item => `
                <tr>
                    <td>${item.name || '-'}</td>
                    <td>${item.category || '-'}</td>
                    <td>${item.price || '-'}</td>
                    <td>${item.lighting_power || '-'}</td>
                    <td>${item.min_volume || '-'}${item.max_volume ? ' - ' + item.max_volume : ''}</td>
                    <td>${item.description || '-'}</td>
                </tr>
            `).join('');

            const tableBody = `<tbody>${tableRows}</tbody>`;
            table.innerHTML = tableHeader + tableBody;
        }

        resultsContainer.innerHTML = '';
        resultsContainer.appendChild(table);
        resultsSection.style.display = 'block';

    } catch (error) {
        console.error('Ошибка при получении оборудования:', error);
        showError('Ошибка при получении оборудования. Попробуйте снова.');
    }
}

function showError(message) {
    alert(message);
}

from flask import Flask, render_template, jsonify, request
import sqlite3
import os

app = Flask(__name__)
DATABASE = 'aqua.db'

def get_db_connection():
    """Получить соединение с БД"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Инициализировать БД и создать таблицу оборудования"""
    if os.path.exists(DATABASE):
        return
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE equipment (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            min_volume INTEGER,
            max_volume INTEGER,
            lighting_power INTEGER,
            aquarium_type TEXT,
            aquarium_subtype TEXT,
            description TEXT
        )
    ''')
    
    conn.commit()
    conn.close()

@app.route('/')
def index():
    """Главная страница"""
    return render_template('index.html')

@app.route('/api/equipment')
def get_equipment():
    """API: получить оборудование с фильтрацией"""
    try:
        conn = get_db_connection()
        
        volume = request.args.get('volume', type=int)
        aquarium_type = request.args.get('aquarium_type')
        aquarium_subtype = request.args.get('aquarium_subtype')
        plant_complexity = request.args.get('plant_complexity')
        
        query = 'SELECT * FROM equipment WHERE 1=1'
        params = []
        
        if volume is not None:
            query += ' AND (min_volume IS NULL OR min_volume <= ?) AND (max_volume IS NULL OR max_volume >= ?)'
            params.extend([volume, volume])
        
        if aquarium_type:
            query += ' AND (aquarium_type IS NULL OR aquarium_type = ?)'
            params.append(aquarium_type)
        
        if aquarium_subtype:
            query += ' AND (aquarium_subtype IS NULL OR aquarium_subtype = ?)'
            params.append(aquarium_subtype)
        
        equipment_list = conn.execute(query, params).fetchall()
        conn.close()
        
        if aquarium_subtype == 'Травник' and volume is not None:
            filtered_equipment = []
            
            for item in equipment_list:
                item_dict = dict(item)
                
                if item_dict.get('category') == 'Светильник':
                    lighting_power = item_dict.get('lighting_power')
                    if lighting_power is None:
                        continue
                    
                    watts_per_liter = lighting_power / volume
                    
                    if plant_complexity == 'Лёгкие':
                        filtered_equipment.append(item_dict)
                    elif plant_complexity == 'Средние':
                        if watts_per_liter >= 0.5:
                            filtered_equipment.append(item_dict)
                    elif plant_complexity == 'Сложные':
                        if watts_per_liter >= 1.0:
                            filtered_equipment.append(item_dict)
                else:
                    filtered_equipment.append(item_dict)
            
            equipment_list = filtered_equipment
        else:
            equipment_list = [dict(e) for e in equipment_list]
        
        return jsonify(equipment_list)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)

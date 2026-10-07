SET NAMES 'utf8mb4';
SET CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS ship_catalog 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE ship_catalog;

DROP TABLE IF EXISTS ships;

CREATE TABLE ships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tonnage INT NOT NULL,
    passengers INT NOT NULL,
    captain VARCHAR(255) NOT NULL,
    speed INT NOT NULL,
    mileage INT NOT NULL,
    price_per_ton DECIMAL(10,2) DEFAULT 0.00,
    price_per_person DECIMAL(10,2) DEFAULT 0.00,
    description TEXT,
    image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE INDEX idx_tonnage ON ships(tonnage);
CREATE INDEX idx_passengers ON ships(passengers);
CREATE INDEX idx_speed ON ships(speed);
CREATE INDEX idx_name ON ships(name);

INSERT INTO ships (name, tonnage, passengers, captain, speed, mileage, price_per_ton, price_per_person, description, image) VALUES
('Морський Гігант', 1200, 300, 'Іван Петренко', 28, 15000, 50.00, 100.00, 'Сучасний круїзний лайнер з усіма зручностями.', '/images/ship1.jpg'),
('Швидкий Вітер', 800, 150, 'Олена Коваль', 35, 20000, 60.00, 120.00, 'Швидкісний корабель для морських подорожей.', '/images/ship2.jpg'),
('Океанська Зірка', 1600, 450, 'Михайло Сидоренко', 25, 18000, 45.00, 90.00, 'Розкішний лайнер для довгих океанських круїзів.', '/images/ship3.jpg'),
('Атлантика', 1400, 320, 'Андрій Мельник', 22, 22000, 55.00, 110.00, 'Комфортабельний корабель для сімейних подорожей.', '/images/ship4.jpg'),
('Блакитна Хвиля', 900, 180, 'Наталія Шевченко', 32, 17000, 65.00, 130.00, 'Елегантне судно для романтичних круїзів.', '/images/ship5.jpg'),
('Золотий Вік', 2000, 600, 'Сергій Бондаренко', 20, 25000, 40.00, 80.00, 'Величний лайнер з розкішними каютами.', '/images/ship6.jpg'),
('Морський Мандрівник', 750, 120, 'Віктор Ковальчук', 38, 12000, 70.00, 140.00, 'Ідеальний для експедицій та досліджень.', '/images/ship7.jpeg');

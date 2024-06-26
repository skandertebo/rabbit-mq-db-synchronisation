create database office;
use office;


CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE,
    region VARCHAR(10),
    product VARCHAR(20),
    qty INT,
    cost DECIMAL(10, 2),
    amt DECIMAL(10, 2),
    tax DECIMAL(10, 2),
    total DECIMAL(10, 2)
);

INSERT INTO sales (date, region, product, qty, cost, amt, tax, total) VALUES ('2024-04-01', 'East', 'Paper', 73, 12.95, 945.35, 66.17, 1011.52), ('2024-04-01', 'West', 'Paper', 33, 12.95, 427.35, 29.91, 457.26),
('2024-04-02', 'East', 'Pens', 14, 2.19, 30.66, 2.15, 32.81),
('2024-04-02', 'West', 'Pens', 40, 2.19, 87.60, 6.13, 93.73),
('2024-04-03', 'East', 'Paper', 21, 12.95, 271.95, 19.04, 290.99),
('2024-04-03', 'West', 'Paper', 10, 12.95, 129.50, 9.07, 138.57);

CREATE TABLE migrations (
    `date` DATE
);

INSERT INTO sales (date, region, product, qty, cost, amt, tax, total) VALUES ('2024-04-01', 'East', 'Paper', 73, 12.95, 945.35, 66.17, 1011.52), ('2024-05-9', 'West', 'Paper', 33, 12.95, 427.35, 29.91, 457.26)
INSERT INTO sales (date, region, product, qty, cost, amt, tax, total) VALUES ('2024-04-01', 'East', 'Paper', 73, 12.95, 945.35, 66.17, 1011.52), ('2024-05-10', 'West', 'Paper', 33, 12.95, 427.35, 29.91, 457.26)
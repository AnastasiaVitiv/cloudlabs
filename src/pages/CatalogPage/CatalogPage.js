import React, { useState, useEffect, useCallback } from "react";
import { shipsApi } from "../../api/shipsApi";
import ShipList from "../../components/ShipList/ShipList";
import PrimaryButton from "../../components/PrimaryButton/PrimaryButton";
import Select from "../../components/Select/Select";
import Loader from "../../components/Loader/Loader";
import "./CatalogPage.css";

function CatalogPage({ searchTerm = "" }) {
    const [ships, setShips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [visibleShipsCount, setVisibleShipsCount] = useState(3);
    const [filters, setFilters] = useState({
        tonnage: '',
        passengers: '',
        speed: ''
    });

    const buildApiParams = useCallback(() => {
        const params = {
            tonnage: filters.tonnage,
            passengers: filters.passengers,
            speed: filters.speed,
            search: searchTerm
        };

        Object.keys(params).forEach(key => {
            if (!params[key]) delete params[key];
        });

        console.log('API параметри:', params);
        return params;
    }, [filters.tonnage, filters.passengers, filters.speed, searchTerm]);

    const fetchShips = useCallback(async () => {
        try {                
            setLoading(true);
            const params = buildApiParams();
            
            const response = await shipsApi.getShips(params);
            setShips(response.data);
            setLoading(false);
            
        } catch (err) {
            console.error('CatalogPage: Помилка:', err);
            setError(err.message);
            setLoading(false);
        }
    }, [buildApiParams]);

    useEffect(() => {
        fetchShips();
    }, [fetchShips]);

    const logButtonClick = async (endpoint, params = {}) => {
        try {
            await shipsApi.logAction(endpoint, params);
            console.log(`Button click logged: ${endpoint}`);
        } catch (error) {
            console.error('Error logging button click:', error);
        }
    };

    const visibleShips = ships.slice(0, visibleShipsCount);
    const hasMoreShips = visibleShipsCount < ships.length;

    const loadMoreShips = () => {
        logButtonClick('log/catalog-view-more', {
            currentCount: visibleShipsCount,
            totalCount: ships.length
        });
        setVisibleShipsCount(prev => prev + 3);
    };

    const handleFilterChange = (filterType, value) => {
        console.log(`CatalogPage: Зміна фільтра ${filterType}:`, value);
        setFilters(prev => ({ ...prev, [filterType]: value }));
        setVisibleShipsCount(3); 
    };

    const clearFilters = () => {
        console.log('CatalogPage: Очищення фільтрів');
        setFilters({
            tonnage: '',
            passengers: '',
            speed: ''
        });
        setVisibleShipsCount(3); 
    };

    const filterConfig = [
        {
            key: 'tonnage',
            label: 'Тонаж',
            options: [
                { value: "", label: "Всі тонажі" },
                { value: "0-1000", label: "До 1000 т" },
                { value: "1000-1500", label: "1000-1500 т" },
                { value: "1500+", label: "Більше 1500 т" }
            ]
        },
        {
            key: 'passengers',
            label: 'Пасажири',
            options: [
                { value: "", label: "Всі пасажири" },
                { value: "0-250", label: "До 250 пасажирів" },
                { value: "250-400", label: "250-400 пасажирів" },
                { value: "400+", label: "Більше 400 пасажирів" }
            ]
        },
        {
            key: 'speed',
            label: 'Швидкість',
            options: [
                { value: "", label: "Всі швидкості" },
                { value: "0-25", label: "До 25 вузлів" },
                { value: "25-30", label: "25-30 вузлів" },
                { value: "30+", label: "Більше 30 вузлів" }
            ]
        }
    ];

    if (loading) {
        return <Loader text="Завантаження кораблів..." />;
    }

    if (error) {
        return (
            <div className="catalog-page">
                <div className="error-message">
                    <h2>Помилка завантаження: {error}</h2>
                    <PrimaryButton onClick={fetchShips}>
                        Спробувати ще раз
                    </PrimaryButton>
                </div>
            </div>
        );
    }

    return (
        <div className="catalog-page">
            <div className="filters-section">
                <div className="filters-container">
                    {filterConfig.map((filter) => (
                        <Select
                            key={filter.key}
                            options={filter.options}
                            value={filters[filter.key]}
                            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                            label={filter.label}
                        />
                    ))}
                    <div className="clear-filters">
                        <PrimaryButton onClick={clearFilters}>
                            Очистити фільтри
                        </PrimaryButton>
                    </div>
                </div>
            </div>
            <h1>Каталог кораблів</h1>
            {ships.length === 0 ? (
                <div className="no-ships-found">
                    <h3>Кораблів не знайдено</h3>
                    <p>Спробуйте змінити параметри пошуку або фільтри</p>
                    <PrimaryButton onClick={clearFilters}>
                        Очистити фільтри
                    </PrimaryButton>
                </div>
            ) : (
                <>
                    <ShipList ships={visibleShips} />
                    {hasMoreShips && (
                        <div className="view-more">
                            <PrimaryButton onClick={loadMoreShips}>
                                View More
                            </PrimaryButton>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default CatalogPage;
import { formatRelativeTime } from '../src/utils/date';

const test = () => {
    const now = new Date();
    
    const tests = [
        { name: 'Just now', date: now.toISOString() },
        { name: '2m ago', date: new Date(now.getTime() - 2 * 60 * 1000).toISOString() },
        { name: '5h ago', date: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString() },
        { name: '2d ago', date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { name: 'Specific date', date: '2023-01-01T10:00:00Z' },
    ];

    tests.forEach(t => {
        console.log(`${t.name}: ${formatRelativeTime(t.date)}`);
    });
};

test();

db = db.getSiblingDB('admin');

db.createCollection('admin_secrets');

db.admin_secrets.insert({
    type: 'flag',
    value: 'FSCAN_LAB{y0u_pwn3d_th3_n3tw0rk}',
    description: 'Final Flag - Congratulations! You have successfully penetrated the entire network!',
    achievement: 'Network Penetration Master',
    timestamp: new Date()
});

db.admin_secrets.insert({
    type: 'credentials',
    service: 'root_access',
    username: 'root',
    password: 'RootP@ss2024',
    notes: 'Full system access - game over!'
});

print('MongoDB initialized with final flag');

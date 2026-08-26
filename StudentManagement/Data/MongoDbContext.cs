using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using StudentManagement.Models;

namespace StudentManagement.Data
{
    public class MongoDbContext
    {
        private readonly IMongoDatabase _database;

        public MongoDbContext(IConfiguration configuration)
        {
            var connectionString = configuration.GetSection("MongoDbSettings:ConnectionString").Value;
            var databaseName = configuration.GetSection("MongoDbSettings:DatabaseName").Value;

            var client = new MongoClient(connectionString);
            _database = client.GetDatabase(databaseName);
        }

        public IMongoCollection<Student> Students => _database.GetCollection<Student>("sinhvien");
    }
}

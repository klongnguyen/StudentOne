using StudentManagement.Data;
using StudentManagement.Repositories;
using StudentManagement.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Đăng ký MongoDbContext dạng Singleton
builder.Services.AddSingleton<MongoDbContext>();

// Đăng ký Repositories và Services
builder.Services.AddScoped<IStudentRepository, StudentRepository>();
builder.Services.AddScoped<IStudentService, StudentService>();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// (Tùy chọn) Thêm Swagger UI (yêu cầu package Swashbuckle.AspNetCore nếu dùng .NET 8 trở xuống, 
// nhưng trong .NET 9 thì OpenAPI thay thế, tuy nhiên ta cứ để mặc định hoặc cài thêm swagger UI sau nếu cần)

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    // app.UseSwaggerUI(options => options.SwaggerEndpoint("/openapi/v1.json", "StudentManagement API"));
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

// Seed data và tạo index
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<MongoDbContext>();
    await DatabaseSeeder.SeedAndCreateIndexesAsync(context);
}

app.Run();

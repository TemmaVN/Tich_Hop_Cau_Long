FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
# Restore trước khi copy source: layer restore được cache,
# sửa code không cần tải lại NuGet (rebuild được khi offline)
COPY MyOwnLearning.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish MyOwnLearning.csproj -c Release -o /app/publish --no-restore

# Stage debug — build cấu hình Debug (JIT không tối ưu nên breakpoint dừng đúng dòng)
# và cài vsdbg để VS Code attach qua `docker exec`.
# Chỉ dùng qua docker-compose.debug.yml (target: debug), không dùng cho production.
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS debug
RUN apt-get update && apt-get install -y --no-install-recommends unzip \
    && rm -rf /var/lib/apt/lists/* \
    && curl -sSL https://aka.ms/getvsdbgsh | bash /dev/stdin -v latest -l /vsdbg
WORKDIR /src
COPY MyOwnLearning.csproj .
RUN dotnet restore
COPY . .
RUN dotnet build MyOwnLearning.csproj -c Debug -o /app/debug --no-restore
WORKDIR /app/debug
ENTRYPOINT ["dotnet", "MyOwnLearning.dll"]

# Stage cuối = mặc định khi build không chỉ định target (production).
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8000
ENTRYPOINT ["dotnet", "MyOwnLearning.dll"]
